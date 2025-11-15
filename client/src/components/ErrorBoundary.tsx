import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div className="error-boundary-content" style={{
            maxWidth: '600px',
            padding: '2rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-surface)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-error)' }}>
              ⚠️ Something went wrong
            </h1>
            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
              The application encountered an unexpected error. You can try reloading the page or resetting the view.
            </p>
            
            {this.state.error && (
              <details style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--color-background)',
                borderRadius: '4px',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Error Details
                </summary>
                <pre style={{
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                className="grand-btn grand-btn-primary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="grand-btn grand-btn-secondary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
