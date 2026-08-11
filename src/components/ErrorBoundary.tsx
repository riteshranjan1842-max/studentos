import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[StudentOS] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
          <div className="max-w-lg w-full glass rounded-2xl p-6 text-center">
            <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-4">
              The app hit a runtime error while loading. Check the browser console for details.
            </p>
            <pre className="text-left text-xs text-rose-300 bg-ink-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
