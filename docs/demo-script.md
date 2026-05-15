# Demo Script

Use this flow for the bounty demo video.

1. Show the bounty requirement: autonomous agent, SAP discovery, Ace Data Cloud services, x402 payments.
2. Show `.env` with secrets hidden.
3. Run `npm run verify` to prove package imports, SAP manifest validation, and mock end-to-end flow.
4. Run `npm run serve` and open `http://localhost:8787/health` plus `http://localhost:8787/sap/manifest`.
5. Run `npm run x402:browser` after funding a Base burner wallet.
6. Open `http://localhost:8787`, connect MetaMask, and click `Run x402 Demo`.
7. Confirm the x402 signatures in MetaMask.
8. Open the latest `runs/x402-*/trace.json`.
9. Point to the three AceDataCloud service entries:
   - `acedata.serp.google`
   - `acedata.webextrator.extract`
   - `acedata.openai.chat.completions`
10. Show `paymentMode=x402-browser-metamask` and the generated x402 evidence.
11. Show `sap-agent-manifest.json` and explain how the agent discovers/selects tools.
12. Show `report.md` as the final autonomous output.

Keep the video under two minutes if possible.
