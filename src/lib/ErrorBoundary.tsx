import React from "react";
import { getReporterConfig } from "./config";
import { sendIssueToProvider } from "./reporters/sendIssue";

type PropsT = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type StateT = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<PropsT, StateT> {
  constructor(props: PropsT) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const config = getReporterConfig();
    sendIssueToProvider(config, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
