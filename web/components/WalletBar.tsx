"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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

  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, sheetOpen]);

  const wrongNetwork =
    typeof chainId === "number" &&
    typeof base.id === "number" &&
    chainId !== base.id;

  const handleSwitch = async () => {
    await switchChainAsync({ chainId: base.id });
  };

  const shortened = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  async function handleConnectorPick(connectorId: string): Promise<void> {
    const connectorInst = config.connectors.find((c) => c.id === connectorId);
    if (!connectorInst) return;
    await connectAsync({
      connector: connectorInst,
      chainId: base.id,
    });
    setSheetOpen(false);
  }

  return (
    <header className="border-b border-cyan-500/30 bg-[#050614]/95 px-4 py-3 backdrop-blur-md">
      {wrongNetwork && (
        <div
          aria-live="polite"
          className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/70 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
          role="status"
        >
          <span>Wrong network. Switch to Base to check in.</span>
          <button
            disabled={switching || !mounted}
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
            className="h-10 w-10 shrink-0 rounded-lg border border-cyan-400/40 object-cover"
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
              disabled={!mounted}
              type="button"
              onClick={() => setSheetOpen(true)}
              className="rounded-lg border border-cyan-400/80 bg-black/55 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cyan-200 shadow-[0_0_18px_-3px_rgba(56,239,239,0.55)] hover:border-cyan-300 hover:text-white disabled:opacity-50"
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

      {mounted ? (
        <ConnectWalletSheetPortal
          onPickConnector={handleConnectorPick}
          onClose={() => setSheetOpen(false)}
          open={sheetOpen}
        />
      ) : null}
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
  if (!open || typeof document === "undefined") {
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
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[min(48vh,8rem)] sm:items-center sm:pb-16"
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
                    try {
                      setBusyId(connector.id);
                      await handlePick(connector.id);
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
