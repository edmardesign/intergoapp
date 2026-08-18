export function reportSystemError(error: unknown, context: Record<string, unknown> = {}) {
  // Telemetry disabled
  console.error('[System Error]', error, context);
}
