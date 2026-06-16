"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorPage } from "@/components/ErrorPage";

// 500 branded para erros de runtime dentro do locale. Reporta ao Sentry.
export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorPage
      code="500"
      message="Something went wrong on our end. We have been notified and are fixing it."
    />
  );
}
