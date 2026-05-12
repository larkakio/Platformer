"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { base } from "wagmi/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { config } from "@/lib/wagmi/config";

/** Wallet picker uses <dialog.showModal()> (top layer) so taps are never trapped under game / layout stacking. */

export function WalletBar() {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { connectAsync } = useConnect();

  const pickerRef = useRef<HTMLDialogElement>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickerLaunchError, setPickerLaunchError] = useState<string | null>(null);

  const wrongNetwork =
    typeof chainId === "number" &&
    typeof base.id === "number" &&
    chainId !== base.id;

  const openPicker = useCallback(() => {
    setPickError(null);
    setPickerLaunchError(null);
    const dlg = pickerRef.current;
    if (!dlg) {
      setPickerLaunchError("Wallet picker is not ready.");
      return;
    }
    try {
      dlg.showModal();
    } catch {
      setPickerLaunchError(
        "This browser blocked the wallet window. Open the site in Safari, Chrome, or the Base app browser.",
      );
    }
  }, []);

  const closePicker = useCallback(() => {
    pickerRef.current?.close();
    setPickError(null);
    setBusyId(null);
  }, []);

  useEffect(() => {
    const d = pickerRef.current;
    if (!d) return undefined;
    const onClose = (): void => {
      setPickError(null);
      setBusyId(null);
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const handleSwitch = async () => {
    await switchChainAsync({ chainId: base.id });
  };

  const shortened = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  const connectors = config.connectors;

  async function handleConnectorPick(connectorId: string): Promise<void> {
    const connectorInst = config.connectors.find((c) => c.id === connectorId);
    if (!connectorInst) return;
    await connectAsync({ connector: connectorInst });
    closePicker();
  }

  return (
    <>
      <header className="sticky top-0 z-50 shrink-0 border-b border-cyan-500/30 bg-[#050614] pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="space-y-2 px-4">
          {wrongNetwork ?
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
          : null}

          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src="/app-icon.jpg"
                width={44}
                height={44}
                alt=""
                priority
                className="pointer-events-none h-10 w-10 shrink-0 select-none rounded-lg border border-cyan-400/40 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.38em] text-cyan-200/85">
                  Neon Flux Relay
                </p>
                <p className="truncate font-mono text-xs text-gray-400">
                  {isConnected ? shortened : "Wallet offline"}
                </p>
                {connector?.name ?
                  <p className="truncate text-[0.62rem] text-fuchsia-300/85">
                    {connector.name}
                  </p>
                : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!isConnected ?
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => openPicker()}
                    className="relative z-[1] cursor-pointer select-none rounded-lg border border-cyan-400/80 bg-black/55 px-3 py-2 text-xs uppercase tracking-[0.16em] text-cyan-200 shadow-[0_0_18px_-3px_rgba(56,239,239,0.55)] hover:border-cyan-300 hover:text-white active:bg-cyan-500/15"
                    style={{ touchAction: "manipulation" }}
                  >
                    Connect
                  </button>
                  {pickerLaunchError ?
                    <p className="max-w-[14rem] text-right text-[0.62rem] text-amber-200">
                      {pickerLaunchError}
                    </p>
                  : null}
                </div>
              : (
                <>
                  {wrongNetwork ?
                    <button
                      disabled={switching}
                      type="button"
                      onClick={() => void handleSwitch()}
                      className="rounded-lg border border-cyan-400/60 bg-black/55 px-2 py-2 text-[0.62rem] uppercase tracking-[0.12em] text-cyan-200"
                    >
                      Base
                    </button>
                  : null}
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
      </header>

      <dialog
        ref={pickerRef}
        className="pointer-events-auto fixed inset-0 z-[2147483647] m-0 flex h-auto max-h-none w-auto max-w-none cursor-default flex-col border-0 bg-black/72 p-0 text-[inherit] shadow-none outline-none [&::backdrop]:bg-black/50"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) closePicker();
        }}
      >
        {/* pointer-events-none so taps pass through to <dialog>; only the sheet captures events */}
        <div className="pointer-events-none flex min-h-[100dvh] w-full flex-1 flex-col justify-end pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:justify-center">
          <div
            className="pointer-events-auto mx-auto mb-4 w-full max-w-md rounded-2xl border border-cyan-500/55 bg-[#061021] p-4 shadow-[0_0_60px_-10px_rgba(34,246,229,0.45)] sm:mb-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-mono text-sm uppercase tracking-[0.24em] text-cyan-200">
                Choose wallet
              </h2>
              <button
                aria-label="Close"
                type="button"
                onClick={() => closePicker()}
                className="rounded-md border border-white/25 px-2 py-1 text-xs uppercase tracking-[0.2em] text-gray-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {pickError ?
              <p
                className="mb-3 rounded-lg border border-red-500/55 bg-red-950/65 px-3 py-2 text-sm text-red-100"
                role="alert"
              >
                {pickError}
              </p>
            : null}

            <div className="mb-[env(safe-area-inset-bottom,0px)] max-h-[min(52vh,420px)] space-y-2 overflow-y-auto overscroll-contain pr-1">
              {connectors.length === 0 ?
                <p className="text-sm leading-relaxed text-gray-400">
                  No wallet connectors loaded. Install a wallet that exposes{" "}
                  <span className="font-mono">window.ethereum</span>, use the Coinbase /
                  Base in-app browser, or set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for
                  WalletConnect.
                </p>
              : (
                connectors.map((c) => (
                  <button
                    disabled={busyId !== null && busyId !== c.id}
                    key={c.id}
                    type="button"
                    onClick={() =>
                      void (async () => {
                        setPickError(null);
                        try {
                          setBusyId(c.id);
                          await handleConnectorPick(c.id);
                        } catch (e: unknown) {
                          const msg =
                            e instanceof Error ?
                              e.message
                            : "Could not connect. Try another option.";
                          setPickError(msg);
                        } finally {
                          setBusyId(null);
                        }
                      })()
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-cyan-400/35 bg-black/65 px-3 py-3 text-left hover:border-fuchsia-400/65 disabled:opacity-50"
                    style={{ touchAction: "manipulation" }}
                  >
                    <span className="font-medium text-gray-50">{c.name}</span>
                    {busyId === c.id ?
                      <span className="text-[0.65rem] uppercase tracking-[0.16em] text-cyan-200">
                        Connecting…
                      </span>
                    : null}
                  </button>
                ))
              )}
            </div>

            <p className="mt-4 text-[0.65rem] uppercase tracking-[0.18em] text-gray-500">
              After connecting, switch to Base if prompted.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
