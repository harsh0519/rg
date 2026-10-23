// Next.js instrumentation. `onRequestError` is the observability hook for server errors —
// logs a scrubbed, structured record (no PII). Plug a provider (Sentry/Datadog) here by
// forwarding `payload` when a DSN is configured.
import type { Instrumentation } from "next";

export async function register() {
  // reserved for provider SDK init when SENTRY_DSN/etc. are set
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const payload = {
    level: "error",
    message: err instanceof Error ? err.message : String(err),
    name: err instanceof Error ? err.name : undefined,
    path: request.path,
    method: request.method,
    phase: context.renderSource ?? context.routerKind,
  };
  console.error("[request-error]", JSON.stringify(payload));
};
