import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Wrappers locale-aware do next-intl. Use estes no lugar de `next/link` e
// `next/navigation` para que os links preservem o idioma atual.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
