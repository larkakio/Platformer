"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { base } from "wagmi/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { config } from "@/lib/wagmi/config";

export function WalletBar() {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { connectAsync } = useConnect();

  const [sheetOpen, setSheetOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const wrongNetwork =
    typeof chainId === "number" &&
    typeof base.id === "number" &&
    chainId !== base.id;

  useLayoutEffect(() => {
    const root = document.documentElement;
    const el = headerRef.current;
    if (!el) return undefined;

    const publish = (): void => {
      root.style.setProperty("--app-header-h", `${el.offsetHeight}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return (): void => {
      ro.disconnect();
      root.style.removeProperty("--app-header-h");
    };
  }, []);

  useEffect(() => {
    if (!sheetOpen || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const handleSwitch = async () => {
    await switchChainAsync({ chainId: base.id });
  };

  const shortened = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  async function handleConnectorPick(connectorId: string): Promise<void> {
    const connectorInst = config.connectors.find((c) => c.id === connectorId);
    if (!connectorInst) return;
    // Do not pass chainId here: forcing an immediate network switch often fails on
    // mobile / Coinbase Wallet before the session exists. Use the banner + "Switch to Base" instead.
    await connectAsync({ connector: connectorInst });
    setSheetOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className="pointer-events-auto fixed inset-x-0 top-0 z-[100000] isolate border-b border-cyan-500/30 bg-[#050614]/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md"
    >
      <div className="space-y-2 px-4 pb-3 pt-3">
      {wrongNetwork && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/70 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
          role="status"
        >
          <span>Wrong network. Switch to Base to check in.</span>
          <button
            disabled={switching}
            onClick={() => void handleSwitch()}
            type="button"
            className="rounded-md border border-amber-300/70 bg-black/60 px-3 py-1 text-xs uppercase tracking-wide text-amber-200 hover:bg-black/90 disabled:opacity-50"
          >
            Switch to Base
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/app-icon.jpg"
            width={44}
            height={44}
            alt=""
            priority
            className="pointer-events-none h-10 w-10 shrink-0 rounded-lg border border-cyan-400/40 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.38em] text-cyan-200/85">
              Neon Flux Relay
            </p>
            <p className="truncate font-mono text-xs text-gray-400">
              {isConnected ? shortened : "Wallet offline"}
            </p>
            {connector?.name ? (
              <p className="truncate text-[0.62rem] text-fuchsia-300/85">
                {connector.name}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isConnected ? (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="relative z-10 cursor-pointer touch-manipulation rounded-lg border border-cyan-400/80 bg-black/55 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cyan-200 shadow-[0_0_18px_-3px_rgba(56,239,239,0.55)] hover:border-cyan-300 hover:text-white"
            >
              Connect
            </button>
          ) : (
            <>
              {wrongNetwork ? (
                <button
                  disabled={switching}
                  type="button"
                  onClick={() => void handleSwitch()}
                  className="rounded-lg border border-cyan-400/60 bg-black/55 px-2 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-cyan-200"
                >
                  Base
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => disconnect()}
                className="rounded-lg border border-fuchsia-500/50 px-3 py-2 text-xs uppercase tracking-[0.12em] text-fuchsia-100 hover:bg-fuchsia-500/10"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>
      </div>

      <ConnectWalletSheetPortal
        onPickConnector={handleConnectorPick}
        onClose={() => setSheetOpen(false)}
        open={sheetOpen}
      />
    </header>
  );
}

function ConnectWalletSheetPortal({
  open,
  onClose,
  onPickConnector,
}: {
  open: boolean;
  onClose: () => void;
  onPickConnector: (connectorId: string) => Promise<void>;
}) {
  if (typeof document === "undefined") {
    return null;
  }
  if (!open) {
    return null;
  }

  return createPortal(
    <ConnectSheet onClose={onClose} onPickConnector={onPickConnector} />,
    document.body,
  );
}

function ConnectSheet({
  onClose,
  onPickConnector,
}: {
  onClose: () => void;
  onPickConnector: (connectorId: string) => Promise<void>;
}) {
  const connectors = config.connectors;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const handlePick = async (connectorId: string) => {
    const connectorPick = connectors.find((c) => c.id === connectorId);
    if (!connectorPick) return;
    await onPickConnector(connectorPick.id);
  };

  return (
    <div
      aria-label="Choose wallet"
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[200000] flex items-end justify-center bg-black/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[min(48vh,8rem)] sm:items-center sm:pb-16"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/55 bg-[#061021]/98 p-4 shadow-[0_0_60px_-10px_rgba(34,246,229,0.45)] backdrop-blur-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-mono text-sm uppercase tracking-[0.24em] text-cyan-200">
            Wallet
          </h2>
          <button
            aria-label="Close wallet picker"
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/25 px-2 py-1 text-xs uppercase tracking-[0.2em] text-gray-300 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="mb-[env(safe-area-inset-bottom)] max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {pickError ? (
            <p
              className="mb-2 rounded-lg border border-red-500/55 bg-red-950/65 px-3 py-2 text-sm text-red-100"
              role="alert"
            >
              {pickError}
            </p>
          ) : null}
          {connectors.length === 0 ? (
            <p className="text-sm leading-relaxed text-gray-400">
              No injected wallet connector is available here. Open inside the
              Coinbase or Base app browser or install a wallet that exposes
              <span className="font-mono"> window.ethereum</span>.
            </p>
          ) : (
            connectors.map((connector) => (
              <button
                disabled={busyId !== null && busyId !== connector.id}
                key={connector.id}
                type="button"
                onClick={() =>
                  void (async () => {
                    setPickError(null);
                    try {
                      setBusyId(connector.id);
                      await handlePick(connector.id);
                    } catch (e: unknown) {
                      const msg =
                        e instanceof Error
                          ? e.message
                          : "Could not connect. Try again or pick another wallet.";
                      setPickError(msg);
                    } finally {
                      setBusyId(null);
                    }
                  })()
                }
                className="flex w-full items-center justify-between rounded-xl border border-cyan-400/35 bg-black/65 px-3 py-3 text-left hover:border-fuchsia-400/65 disabled:opacity-50"
              >
                <span className="font-medium text-gray-50">
                  {connector.name}
                </span>
                {busyId === connector.id ? (
                  <span className="text-[0.65rem] uppercase tracking-[0.16em] text-cyan-200">
                    Connecting…
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>

        <p className="mt-4 text-[0.65rem] uppercase tracking-[0.18em] text-gray-500">
          Connect targeting Base chain · Standard wallet web flow
        </p>
      </div>
    </div>
  );
}
