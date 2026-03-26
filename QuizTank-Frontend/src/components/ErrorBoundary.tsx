import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully.
 * Displays a user-friendly error message instead of crashing the app.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to monitoring service in production
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[50vh] items-center justify-center p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-full bg-destructive/10">
                                <AlertTriangle className="w-12 h-12 text-destructive" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Something went wrong
                        </h1>

                        <p className="text-muted-foreground mb-6">
                            We encountered an unexpected error. Please try again or return to the home page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left bg-muted p-4 rounded-lg overflow-auto">
                                <summary className="cursor-pointer font-medium text-sm">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="mt-2 text-xs text-destructive whitespace-pre-wrap">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </Button>
                            <Button onClick={this.handleGoHome} className="gap-2">
                                <Home className="w-4 h-4" />
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
