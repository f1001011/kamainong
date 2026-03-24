/**
 * @file 全局错误边界组件
 * @description 捕获 React 组件错误，显示友好的错误页面
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { RiRefreshLine } from '@remixicon/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 * @description 捕获子组件的 JavaScript 错误，记录错误并显示备用 UI
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // 这里可以添加错误上报逻辑
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
          }}
        >
          <Result
            status="error"
            title="页面出错了"
            subTitle={
              <div>
                <p>抱歉，页面遇到了一些问题</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <pre
                    style={{
                      textAlign: 'left',
                      background: '#fff1f0',
                      padding: 16,
                      borderRadius: 4,
                      fontSize: 12,
                      maxWidth: 600,
                      overflow: 'auto',
                    }}
                  >
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            }
            extra={[
              <Button
                key="retry"
                type="primary"
                icon={<RiRefreshLine size={16} style={{ marginRight: 4 }} />}
                onClick={this.handleRetry}
              >
                重试
              </Button>,
              <Button key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
