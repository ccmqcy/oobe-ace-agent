# OOBE x Ace Data Cloud Agent MVP

This project is a submission-oriented MVP for the Superteam bounty:

- Listing: Autonomous Agent Bounty: OOBE x Ace Data Cloud
- Prize pool: 2,400 USDC
- Target category: Ace Data Cloud Usage via x402 facilitator

The agent demonstrates an autonomous workflow:

1. Accept a target project or token.
2. Discover/select tools in a SAP-compatible manifest.
3. Use three AceDataCloud services:
   - SERP search
   - WebExtrator extraction
   - OpenAI-compatible chat synthesis
4. Route paid calls through AceDataCloud x402 in live mode.
5. Produce a due-diligence report and a machine-readable execution trace.

## Current Status

Mock mode is ready for local verification and demo scripting. Live mode is wired for AceDataCloud token or x402 payment, but should only be run with a fresh funded burner wallet and explicit approval.

SAP registration is prepared as a manifest/validation step. Real on-chain registration still needs a Synapse RPC API key and a fresh Solana burner keypair.

## Install

```bash
npm install --ignore-scripts
```

Dependencies are already pinned in `package-lock.json`.

## Run Mock Demo

```bash
npm run demo
```

The command writes outputs under `runs/`.

## Run Verification

```bash
npm run verify
```

This checks package imports, validates the SAP manifest, runs the mock workflow, and verifies the generated trace contains the required services.

## Run Local Agent Endpoint

```bash
npm run serve
```

Endpoints:

- `GET /health`
- `GET /sap/manifest`
- `POST /run` with body `{"target":"OOBE Protocol","mode":"mock"}`

## Run Browser x402 Demo

Use this when you have a Base burner wallet with a small amount of USDC.

```bash
npm run x402:browser
```

Open:

```text
http://localhost:8787
```

Then:

1. Connect MetaMask.
2. Confirm the wallet is on Base.
3. Click `Run x402 Demo`.
4. Sign one x402 payment per AceDataCloud service.
5. Use the generated `runs/x402-*/trace.json` and `runs/x402-*/report.md` as live evidence.

The browser signs payment authorizations through MetaMask. The project does not need or store the wallet private key.

## Live Mode

Copy `.env.example` to `.env`, then choose one payment path.

Token/free-credit path:

```bash
ACE_PAYMENT_MODE=token
ACEDATACLOUD_API_TOKEN=...
```

x402 path:

```bash
ACE_PAYMENT_MODE=x402
ACE_X402_NETWORK=base
ACE_EVM_PRIVATE_KEY=...
```

Use only a burner wallet with a small amount of USDC. Do not use a main wallet.

Then run:

```bash
npm run live
```

## Submission Assets

Use these files after live verification:

- `docs/demo-script.md`
- `docs/submission-checklist.md`
- latest `runs/*/report.md`
- latest `runs/*/trace.json`
