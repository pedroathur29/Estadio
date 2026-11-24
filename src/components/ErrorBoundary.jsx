import { Component } from 'react';

/**
 * Catches render errors of its children so one failing part does not blank the whole app.
 * `fallback` is a node or a function `(error, reset) => node`; `onError` is called once per error.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
    this.props.onError?.(error);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === 'function' ? fallback(error, this.reset) : (fallback ?? null);
  }
}

/** Last-resort screen shown when the whole app fails to render. */
export function AppError({ reset }) {
  return (
    <main className="app-error" role="alert">
      <h1>Algo deu errado</h1>
      <p>Não foi possível exibir esta tela. A demonstração não realiza vendas, então nada foi perdido.</p>
      <div className="app-error-actions">
        <button className="btn btn-primary" onClick={reset}>
          Tentar novamente
        </button>
        <button className="btn btn-ghost" onClick={() => window.location.reload()}>
          Recarregar a página
        </button>
      </div>
    </main>
  );
}
