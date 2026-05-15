# Live Evidence Summary

Date: 2026-05-15

## Result

Status: live x402 run verified.

The browser MetaMask runner completed the three-service AceDataCloud workflow using x402 payments from a Base burner wallet.

## Run

- Run directory: `runs/x402-2026-05-15T04-15-00-781Z`
- Public-safe report: `runs/x402-2026-05-15T04-15-00-781Z/report.md`
- Raw trace: `runs/x402-2026-05-15T04-15-00-781Z/trace.json`
- SAP manifest snapshot: `runs/x402-2026-05-15T04-15-00-781Z/sap-agent-manifest.json`

## Payment

- Payment mode: `x402-browser-metamask`
- Network: Base
- Burner wallet: `0x8ee2967f3c2008a8a8bd77da5f736bbbad7af9e3`
- Observed cost:
  - `acedata.serp.google`: about `0.000952 USDC`
  - `acedata.webextrator.extract`: about `0.000476 USDC`
  - `acedata.openai.chat.completions`: about `0.095215 USDC`
  - Total: about `0.096643 USDC`

The MetaMask balance moved from about `0.200 USDC` to about `0.103 USDC`, matching the expected x402 run cost.

## Services Completed

- `acedata.serp.google`
- `acedata.webextrator.extract`
- `acedata.openai.chat.completions`

## Output

The final report was written to `report.md` and includes:

- OOBE Protocol opportunity summary
- Ace Data Cloud bounty link
- risk considerations
- next-action synthesis

## Public Evidence Guidance

Use these for public submission:

- GitHub repo: `https://github.com/ccmqcy/oobe-ace-agent`
- `docs/live-evidence-summary.md`
- `docs/live-x402-report.md`
- `docs/sap-agent-metadata.json`
- demo video showing the browser x402 runner and MetaMask signatures

Do not publish raw `runs/x402-2026-05-15T04-15-00-781Z/trace.json` without manual review. It can include raw extracted web page content and payment metadata.

## Remaining

- Optional: record a short demo video.
- Required before final bounty submission: complete real SAP/OOBE mainnet registration with a Synapse RPC endpoint and a fresh Solana burner keypair, then attach the registration signature or explorer link.
- Required for bounty submission: X post and Superteam form submission.
