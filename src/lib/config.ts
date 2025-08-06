import { ErrorReporterConfigT } from "./types";

let config: ErrorReporterConfigT;

export function configureReporter(cfg: ErrorReporterConfigT): void {
  config = cfg;
}

export function getReporterConfig(): ErrorReporterConfigT {
  return config;
}
