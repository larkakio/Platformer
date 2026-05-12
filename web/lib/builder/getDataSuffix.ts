import type { Hex } from "viem";
import { Attribution } from "ox/erc8021";

/**
 * ERC-8021 attribution suffix for Base Builder Codes (see Base docs).
 * Pass the result as `dataSuffix` on viem/wagmi contract writes so calldata ends with the
 * standard suffix; contracts ignore it.
 *
 * @see https://docs.base.org/base-chain/builder-codes/app-developers
 *
 * Resolution: `NEXT_PUBLIC_BUILDER_CODE_SUFFIX` (full `0x…` hex) wins; otherwise encodes
 * `NEXT_PUBLIC_BUILDER_CODE` (e.g. `bc_…`) via `Attribution.toDataSuffix({ codes: [code] })`.
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
