import BasketballGame from "@/components/game/BasketballGame";
import ErrorBoundary from "@/components/ErrorBoundary";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="relative w-full h-screen h-dvh overflow-hidden">
      <ErrorBoundary>
        <BasketballGame />
      </ErrorBoundary>
    </main>
  );
}

