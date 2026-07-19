import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorState from "@/components/ui/ErrorState";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) return fallback;
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
          <ErrorState
            title="战场系统异常"
            description="游戏运行过程中发生错误，请重试或返回主页。"
            error={error}
            onRetry={this.handleRetry}
          />
        </div>
      );
    }

    return children;
  }
}
