// src/components/ErrorBoundary.tsx
import React from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary для перехвата ошибок рендеринга React компонентов.
 * Позволяет приложению "gracefully" обрабатывать ошибки без полного краха.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Логирование ошибки (в production можно отправить в Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Result
          status="error"
          title="Что-то пошло не так"
          subTitle={this.state.error?.message || 'Произошла непредвиденная ошибка'}
          extra={[
            <Button type="primary" key="retry" onClick={this.handleRetry}>
              Попробовать снова
            </Button>,
            <Button key="home" onClick={() => window.location.href = '/'}>
              На главную
            </Button>,
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
