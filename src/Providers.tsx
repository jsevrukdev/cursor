import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function Providers({ children }: { children: ReactNode }) {
  if (!convexClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink p-8 text-paper">
        <div className="max-w-md space-y-3">
          <p className="font-display text-3xl">Shotline needs Convex</p>
          <p className="text-paper/80">
            Run <code className="rounded bg-white/10 px-1">npx convex dev</code> and set{" "}
            <code className="rounded bg-white/10 px-1">VITE_CONVEX_URL</code> in{" "}
            <code className="rounded bg-white/10 px-1">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ConvexProvider client={convexClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </ConvexProvider>
  );
}
