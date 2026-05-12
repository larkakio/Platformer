import type { Hex } from "viem";
import { Attribution } from "ox/erc8021";

/**
 * ERC-8021 builder code suffix for check-in txs.
 * Prefers NEXT_PUBLIC_BUILDER_CODE_SUFFIX hex; otherwise derives from NEXT_PUBLIC_BUILDER_CODE (bc_…).
 */
export function getCheckInDataSuffix(): Hex | undefined {
  const suffix = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX?.trim();
  if (suffix && suffix.startsWith("0x")) {
    return suffix as Hex;
  }
  const code = process.env.NEXT_PUBLIC_BUILDER_CODE?.trim();
  if (!code) {
    return undefined;
  }
  return Attribution.toDataSuffix({
    codes: [code],
  });
}
