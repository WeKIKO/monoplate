export interface ReadinessProbe {
  check(): Promise<boolean>;
}
