import { CheckInPanel } from "@/components/CheckInPanel";
import { PlatformGame } from "@/components/PlatformGame";
import { WalletBar } from "@/components/WalletBar";

export default function Page() {
  return (
    <>
      <WalletBar />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4 md:overflow-y-auto md:overscroll-y-none">
        <header className="mb-6 text-center md:text-left">
          <h1
            aria-label="Neon Flux Relay"
            className="font-mono text-[0.7rem] uppercase tracking-[0.6em] text-cyan-200/92"
          >
            Neon Flux Relay
          </h1>
          <p className="mt-2 max-w-xl text-[1.58rem] font-semibold uppercase leading-snug tracking-tight text-transparent [text-shadow:_0_0_40px_rgb(246_113_239_/_55%)] [background-image:linear-gradient(96deg,#5afdfb_23%,#f472f5_45%,#7e2bfb_112%)] [background-clip:text] [-webkit-background-clip:text]">
            Drift shards. Fuse the skyline.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-gray-300/95">
            A vertical slice built for Base App as a standard mobile web runner:
            kinetic neon glass tiles, tactile swipe impulses, aux flux jumps once
            you unlock Chromatic Shaft—and a relay ping you only pay L2 gas for.
          </p>
        </header>

        <section className="flex flex-1 flex-col items-center">
          <PlatformGame />
        </section>

        <div className="mt-8 shrink-0">
          <CheckInPanel />
          <footer className="mt-12 border-t border-cyan-500/25 pb-24 pt-6 text-[0.72rem] font-mono uppercase tracking-[0.22em] text-gray-500">
            Signals only · English UI · Powered by wagmi · viem · ox ERC-8021
          </footer>
        </div>
      </main>
    </>
  );
}
