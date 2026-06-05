import React, { Component, ErrorInfo, ReactNode } from 'react';
import { remoteLog } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    remoteLog(error, {
      level: 'ERROR',
      context: 'REACT-ERROR-BOUNDARY',
      // Incluimos el stack de componentes de React para saber exactamente dónde falló
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center bg-red-50 text-red-900 rounded-lg border border-red-200 m-4">
          <h2 className="text-xl font-bold mb-2">Algo ha salido mal</h2>
          <p>Se ha enviado un informe de error al equipo técnico.</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Recargar aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
  