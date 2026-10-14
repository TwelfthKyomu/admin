'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/ui/Base';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: never) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: undefined,
        });

        this.props.onReset?.();
    };

    override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div>
                    <div>
                        <AlertTriangle size={32} />
                    </div>
                    <h2>Что-то пошло не так</h2>
                    <p>Произошла ошибка при загрузке данных. Пожалуйста, попробуйте еще раз.</p>
                    {this.state.error && (
                        <details>
                            <summary>Подробности ошибки</summary>
                            <pre>{this.state.error.message}</pre>
                        </details>
                    )}
                    <Button onClick={this.handleReset}>
                        <RefreshCw size={18} />
                        <span>Попробовать снова</span>
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
