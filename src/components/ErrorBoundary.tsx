import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="font-display text-3xl mb-3">Something went wrong</h1>
            <p className="text-muted-foreground mb-2">
              An unexpected error occurred. Please reload the page to continue.
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground font-mono bg-secondary/40 rounded-lg p-3 mb-6 break-all">
                {this.state.error.message}
              </p>
            )}
            <Button variant="gold" size="lg" onClick={this.handleReload}>
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
