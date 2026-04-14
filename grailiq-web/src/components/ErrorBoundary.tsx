import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Wraps the app tree so one failing route
 * doesn't white-screen the entire experience. Logs to console so Sentry/LogRocket
 * can pick it up if wired; shows a friendly recovery screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('App crashed', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-grailiq-ink text-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-400 mb-5">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Something broke on our end</h1>
          <p className="text-sm text-gray-400 mt-2">
            The page hit an error it couldn't recover from. Try a refresh — if it keeps happening,
            shoot us a note at{' '}
            <a href="mailto:support@grailiq.com" className="text-grailiq-purple-light hover:text-white">
              support@grailiq.com
            </a>
            .
          </p>
          {this.state.error.message && (
            <pre className="mt-5 text-xs text-rose-300 bg-rose-500/5 border border-rose-400/20 rounded-xl p-3 text-left overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 hover:shadow-grailiq-purple/50 hover:brightness-110 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Reload the page
          </button>
        </div>
      </div>
    );
  }
}
