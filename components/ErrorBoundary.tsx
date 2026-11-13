"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Unexpected runtime rendering interruption",
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Game ErrorBoundary caught error:", error, info);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, message: "" });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#080a0f] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-neutral-950 border border-amber-500/35 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Arena Recovery Shield
                </h2>
                <p className="text-xs text-white/60">
                  Saved progress is intact in protected local storage.
                </p>
              </div>
            </div>
            <p className="text-xs text-red-300/90 bg-red-950/40 border border-red-500/30 rounded-xl p-3 font-mono break-words">
              {this.state.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleRecover}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Resume Court</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase text-xs tracking-wider cursor-pointer"
              >
                Reload App
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
