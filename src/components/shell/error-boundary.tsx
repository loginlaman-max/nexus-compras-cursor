"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Nexus — erro de render:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
          <AlertTriangle className="size-8 text-[hsl(var(--status-baixo))]" />
          <h1 className="type-h1">Algo deu errado nesta tela</h1>
          <p className="type-caption leading-relaxed">
            {this.state.error.message ||
              "Erro ao montar o componente. Tente recarregar a página."}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={() => this.setState({ error: null })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
