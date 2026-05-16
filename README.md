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

Mock mode is ready for local verification and demo scripting. Live AceDataCloud token mode has been verified, and the browser MetaMask x402 flow has also been verified with a Base burner wallet.

SAP registration is prepared as a manifest/validation step. The final bounty submission still needs real SAP mainnet registration with a Synapse RPC endpoint and a fresh Solana burner keypair.

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

## SAP Mainnet Registration

Generate a fresh Solana burner keypair:

```bash
npm run sap:keypair
```

Fund the printed public key with about `0.045 SOL` for SAP account rent and transaction fees, then set `SYNAPSE_RPC_URL` and `SAP_AGENT_KEYPAIR_PATH` in `.env`.

Dry-run the registration payload:

```bash
npm run sap:register:dry
```

Send the SAP registration transaction:

```bash
npm run sap:register
```

Check the registered agent PDA:

```bash
npm run sap:check
```

## Submission Assets

Use these files after live verification:

- `docs/demo-script.md`
- `docs/submission-checklist.md`
- `docs/live-evidence-summary.md`
- `docs/live-x402-report.md`
- `docs/sap-agent-metadata.json`
- `docs/superteam-submission-draft.md`
- latest `runs/*/report.md`
- latest `runs/*/trace.json`

Keep raw `runs/*/trace.json` local unless manually reviewed first. It can contain raw third-party page content and payment metadata. Prefer the sanitized evidence summary plus `report.md` for public submission.
