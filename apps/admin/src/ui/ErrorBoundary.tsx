import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Admin render failed", error, info); }
  render() { return this.state.error ? <main><h1>Something went wrong</h1><button onClick={() => location.reload()}>Reload</button></main> : this.props.children; }
}
