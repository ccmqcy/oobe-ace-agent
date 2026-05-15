# Superteam Submission Draft

## Link to Submission

```text
https://github.com/ccmqcy/oobe-ace-agent
```

## Tweet Draft

```text
Built AceIntelAgent for the OOBE x Ace Data Cloud bounty: SAP-style tool discovery, AceDataCloud SERP/WebExtrator/OpenAI calls, and live x402 payments from a Base burner wallet.

Repo: https://github.com/ccmqcy/oobe-ace-agent
@OOBEonSol @AceDataCloud @SuperteamEarn
```

## Anything Else

```text
Project: AceIntelAgent

I built a submission-oriented autonomous agent MVP for the OOBE x Ace Data Cloud bounty.

What it demonstrates:
- SAP-style tool discovery through a generated agent manifest. Final submission should also include the SAP mainnet registration signature once registered.
- Live AceDataCloud service usage across SERP search, WebExtrator extraction, and OpenAI-compatible chat synthesis.
- Browser-based x402 payments through MetaMask from a Base burner wallet.
- A complete trigger -> service calls -> paid settlement -> report flow.

Live x402 evidence:
- paymentMode: x402-browser-metamask
- wallet: 0x8ee2967f3c2008a8a8bd77da5f736bbbad7af9e3
- run directory: runs/x402-2026-05-15T04-15-00-781Z
- completed services: acedata.serp.google, acedata.webextrator.extract, acedata.openai.chat.completions
- estimated run cost: about 0.096643 USDC

Public-safe evidence files:
- docs/live-evidence-summary.md
- docs/live-x402-report.md
- docs/sap-agent-metadata.json
- docs/demo-script.md

The raw trace is kept local because it may include raw third-party page content and payment metadata. The public repo contains the implementation, browser runner, verification scripts, and sanitized evidence notes.

Remaining before final submission:
- SAP mainnet registration signature or explorer link.
```

## Optional Eligibility Answers

### Project Title

```text
AceIntelAgent
```

### What did you build?

```text
AceIntelAgent is an autonomous research agent that discovers a SAP-style service manifest, selects AceDataCloud tools, executes a three-step workflow, pays each live service call through x402, and produces a final due-diligence report for a target project.
```

### How does it use Ace Data Cloud and x402?

```text
The browser runner requests x402 payment requirements from AceDataCloud, asks MetaMask to sign Base USDC TransferWithAuthorization payloads, submits the x402 payment headers to AceDataCloud, and then consumes three paid services: SERP search, WebExtrator extraction, and OpenAI-compatible chat completions.
```

### How is it agentic?

```text
The workflow accepts a target, discovers available tools from a manifest, chooses the service sequence, executes paid external calls, and writes a structured report plus machine-readable trace without requiring the operator to manually call each service.
```
