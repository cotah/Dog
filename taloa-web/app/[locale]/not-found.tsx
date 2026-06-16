import { ErrorPage } from "@/components/ErrorPage";

// 404 branded para rotas dentro de um locale (ex: tag/pagina inexistente).
export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      message="This page does not exist. Maybe the tag was moved or the link is broken."
    />
  );
}
