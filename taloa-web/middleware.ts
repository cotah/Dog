import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

// Middleware do next-intl: detecta o idioma (cookie > Accept-Language), aplica
// o prefixo de locale e seta o cookie NEXT_LOCALE.
const intlMiddleware = createIntlMiddleware(routing);

// Rotas que exigem login (independente do prefixo de idioma).
const PROTECTED = ["/owner", "/admin"];

// Remove o prefixo de locale do path para comparar com as rotas protegidas.
// Ex: "/pt/owner/dashboard" -> "/owner/dashboard"; "/owner" -> "/owner".
function stripLocale(pathname: string): { path: string; locale: string } {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    const rest = "/" + segments.slice(2).join("/");
    return { path: rest === "/" ? "/" : rest.replace(/\/$/, ""), locale: maybeLocale };
  }
  return { path: pathname, locale: routing.defaultLocale };
}

export async function middleware(request: NextRequest) {
  // 1) i18n primeiro: resolve locale, seta cookie e trata redirects de idioma.
  const response = intlMiddleware(request);

  // 2) descobre o path sem o prefixo de locale + o idioma atual.
  const { path, locale } = stripLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED.some(
    (p) => path === p || path.startsWith(p + "/"),
  );

  // Rotas publicas: o next-intl ja resolveu tudo.
  if (!isProtected) return response;

  // 3) Auth Supabase nas rotas protegidas. Os cookies refrescados sao escritos
  //    no `response` que o next-intl ja montou (preserva o cookie de locale).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Prefixo a manter nos redirects (idioma default = en nao tem prefixo).
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  // Sem usuario -> login, guardando o destino (com idioma preservado).
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `${prefix}/login`;
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Area admin: confere o role no banco (nao apenas presenca de sessao).
  if (path === "/admin" || path.startsWith("/admin/")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const ownerUrl = request.nextUrl.clone();
      ownerUrl.pathname = `${prefix}/owner/dashboard`;
      ownerUrl.search = "";
      return NextResponse.redirect(ownerUrl);
    }
  }

  return response;
}

export const config = {
  // Roda em tudo, exceto API, internos do Next e arquivos com extensao
  // (manifest.json, sw.js, icones, etc.).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
