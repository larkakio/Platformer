# Foundry — `CheckIn`

- `checkIn()` — one successful call per address per **UTC day** (`block.timestamp / 86400`).
- `msg.value` must be `0` — users only pay L2 gas.

## Commands

```bash
forge test
forge build
```

## Deploy sketch

```bash
FOUNDRY_PROFILE=default forge create src/CheckIn.sol:CheckIn --rpc-url "$BASE_MAINNET_RPC" --broadcast
```

Paste the deployed address into `web/.env.local` as `NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS`.
