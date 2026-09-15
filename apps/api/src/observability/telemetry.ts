import type { ServerEnv } from "@monoplate/config/server";
export async function initializeTelemetry(env: ServerEnv) {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) return undefined;
  const [{ NodeSDK }, { OTLPTraceExporter }, { getNodeAutoInstrumentations }] = await Promise.all([import("@opentelemetry/sdk-node"), import("@opentelemetry/exporter-trace-otlp-http"), import("@opentelemetry/auto-instrumentations-node")]);
  const sdk = new NodeSDK({ serviceName: env.OTEL_SERVICE_NAME, traceExporter: new OTLPTraceExporter({ url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")}/v1/traces` }), instrumentations: [getNodeAutoInstrumentations()] });
  sdk.start();
  return sdk;
}
