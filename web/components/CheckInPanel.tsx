"use client";

import { useMemo, useState } from "react";
import { isAddress } from "viem";
import { base } from "wagmi/chains";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { getCheckInDataSuffix } from "@/lib/builder/getDataSuffix";
import { checkInAbi } from "@/lib/contracts/checkInAbi";

const rawAddr = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS;

export function CheckInPanel() {
  const { address, isConnected, chainId } = useAccount();
  const contractAddress = rawAddr ?? "";
  const valid =
    typeof contractAddress === "string" && isAddress(contractAddress);

  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const suffix = useMemo(() => getCheckInDataSuffix(), []);

  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: base.id,
  });

  const [localError, setLocalError] = useState<string | null>(null);

  const busy =
    isPending ||
    isSwitchPending ||
    (Boolean(txHash) && confirming === true && !isSuccess);

  const wrongNetwork =
    typeof chainId === "number" && chainId !== base.id && chainId !== undefined;

  const handleCheckIn = async () => {
    setLocalError(null);
    reset();
    try {
      if (!isConnected) {
        throw new Error("Connect your wallet first.");
      }
      if (!valid) {
        throw new Error("Check-in contract is not configured.");
      }
      const baseChainId = base.id;
      if (chainId !== baseChainId) {
        await switchChainAsync({ chainId: baseChainId });
      }
      await writeContractAsync({
        abi: checkInAbi,
        address: contractAddress as `0x${string}`,
        functionName: "checkIn",
        chainId: baseChainId,
        value: BigInt(0),
        ...(suffix ? { dataSuffix: suffix } : {}),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Check-in failed.";
      setLocalError(msg);
    }
  };

  const errLine = error?.message ?? localError;

  return (
    <section className="mt-6 rounded-2xl border border-emerald-500/35 bg-[#070717]/92 p-4 shadow-inner shadow-black/75">
      <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-emerald-200">
        Daily Relay Ping
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">
        One on-chain heartbeat per UTC day—gas only on Base Mainnet—Builder Code
        suffix attached automatically when configured.
      </p>
      {!valid ? (
        <p className="mt-4 text-xs text-amber-200">
          Deploy the contract then set NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS on
          Vercel.
        </p>
      ) : null}
      <dl className="mt-4 space-y-1 font-mono text-[0.65rem] text-gray-400">
        <div className="flex justify-between gap-3">
          <dt>Network</dt>
          <dd className="text-right">{wrongNetwork ? "Not Base" : "Base OK"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Signer</dt>
          <dd className="truncate text-right text-gray-200">
            {address ?? "—"}
          </dd>
        </div>
      </dl>
      <button
        disabled={!isConnected || !valid || busy}
        onClick={() => void handleCheckIn()}
        type="button"
        className="relative mt-4 w-full rounded-xl border border-emerald-400/70 bg-gradient-to-r from-[#07332b] via-[#103f50] to-[#2a0f4a] py-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100 shadow-[0_0_40px_-6px_rgba(34,239,209,0.55)] hover:border-emerald-200 disabled:opacity-45"
      >
        {busy ? (
          <>
            {isSwitchPending
              ? "Switching chain… "
              : isPending
                ? "Awaiting wallet… "
                : confirming && txHash
                  ? "Confirming… "
                  : "Working… "}
          </>
        ) : (
          "Check in on-chain"
        )}
      </button>
      {errLine ? (
        <pre className="mt-4 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg border border-red-500/50 bg-black/65 p-2 text-[0.7rem] text-red-100">
          {errLine}
        </pre>
      ) : null}
      {txHash ? (
        <p className="mt-3 break-all font-mono text-[0.65rem] text-cyan-200/95">
          {isSuccess ? "Confirmed · " : "Pending · "}
          tx {txHash}
        </p>
      ) : null}
    </section>
  );
}
