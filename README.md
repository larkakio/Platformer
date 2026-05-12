# Neon Flux Relay (Base)

Monorepo for a **mobile-first** cyberpunk swipe platformer plus a **daily `checkIn()`** on Base.

- [`web/`](./web) — Next.js App Router (deploy this folder to Vercel).
- [`contracts/`](./contracts) — Foundry `CheckIn.sol` (gas-only L2 check-in, `msg.value` rejected).

## Contracts

```bash
cd contracts && forge test && forge build
```

Deploy (set `DEPLOYER_PK` or use Ledger via Foundry flags), then copy the contract address into `NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS` for the web app.

## Web (Vercel root = `web/`)

```bash
cd web && cp .env.example .env.local && npm install && npm run dev
```

Set `NEXT_PUBLIC_BASE_APP_ID`, `NEXT_PUBLIC_BUILDER_CODE` (or `NEXT_PUBLIC_BUILDER_CODE_SUFFIX`), and the check-in address after deployment. The root layout includes an explicit `<meta name="base:app_id" />` for Base.dev verification (View Source safe).

## Assets

`public/app-icon.jpg` (≤1024², ≤1MB) and `public/app-thumbnail.jpg` (≈1.91:1, ≤1MB) are used for Base.dev / marketing. Regenerate with `sips` cropping so aspect ratios are never stretched.
