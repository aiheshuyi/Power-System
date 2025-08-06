import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center',
          background: '#f5f5f5',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '500px'
          }}>
            <h2 style={{ color: '#ff4d4f', marginBottom: '16px' }}>应用出现错误</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              抱歉，应用遇到了一个错误：
            </p>
            <div style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#ff4d4f',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.message || '未知错误'}
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#1890ff',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 