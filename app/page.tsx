import BasketballGame from "@/components/game/BasketballGame";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <BasketballGame />
    </main>
  );
}

