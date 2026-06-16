import { notFound } from "next/navigation";

// Catch-all: qualquer caminho nao casado dentro de um locale dispara o
// not-found branded (app/[locale]/not-found.tsx). Padrao recomendado do
// next-intl para 404 em rotas desconhecidas.
export default function CatchAll() {
  notFound();
}
