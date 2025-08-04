import { ErrorReporterConfig } from "./types";

let config: ErrorReporterConfig;

export function configureReporter(cfg: ErrorReporterConfig) {
  config = cfg;
}

export function getReporterConfig() {
  return config;
}
