import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary capturou uma exceção:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-950/20 border border-rose-500/40 rounded-xl space-y-4 my-4 font-sans">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-serif font-bold text-base">
                {this.props.fallbackTitle || "Falha de Renderização Isolada"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Um erro de exibição ocorreu neste componente, mas o restante da Coterie continua funcionando.
              </p>
            </div>
          </div>
          {this.state.error && (
            <pre className="p-3 bg-black/60 border border-rose-500/20 rounded text-[11px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs gap-1.5 border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tentar Recarregar Componente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
