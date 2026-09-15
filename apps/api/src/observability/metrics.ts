type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OTHER";
export class ApiMetrics {
  #requests = new Map<string, number>();
  #durationMs = new Map<string, number>();
  record(method: string, route: string, status: number, durationMs: number) { const safeMethod: Method = ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method) ? method as Method : "OTHER"; const key = `${safeMethod}|${route}|${status}`; this.#requests.set(key, (this.#requests.get(key) ?? 0) + 1); this.#durationMs.set(key, (this.#durationMs.get(key) ?? 0) + durationMs); }
  render() { const lines = ["# HELP monoplate_http_requests_total Total HTTP requests", "# TYPE monoplate_http_requests_total counter"]; for (const [key, count] of this.#requests) { const [method, route, status] = key.split("|"); lines.push(`monoplate_http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`); } lines.push("# HELP monoplate_http_request_duration_ms_total Cumulative HTTP request duration", "# TYPE monoplate_http_request_duration_ms_total counter"); for (const [key, duration] of this.#durationMs) { const [method, route, status] = key.split("|"); lines.push(`monoplate_http_request_duration_ms_total{method="${method}",route="${route}",status="${status}"} ${duration.toFixed(3)}`); } return `${lines.join("\n")}\n`; }
}
