import { createRequire } from 'node:module';
import { PublicKey } from '@solana/web3.js';

const require = createRequire(import.meta.url);
const sap = require('@oobe-protocol-labs/synapse-sap-sdk');

export function buildSapAgentManifest(config) {
  const fallbackPublicKey = '11111111111111111111111111111111';
  const publicKey = config.sap.publicKey || fallbackPublicKey;
  const agentWallet = new PublicKey(publicKey);
  const [agentPda] = sap.Pdas.getAgentPDA(agentWallet);

  const manifest = {
    name: 'AceIntelAgent',
    description: 'Autonomous market-intelligence agent using SAP discovery and AceDataCloud x402-paid services.',
    protocols: ['sap', 'acedata-cloud', 'x402'],
    x402Endpoint: config.sap.endpoint,
    agentUri: config.sap.agentUri,
    agentWallet: agentWallet.toBase58(),
    agentPda: agentPda.toBase58(),
    capabilities: [
      {
        id: 'acedata.serp.google',
        protocolId: 'acedata-cloud',
        version: '1.0.0',
        description: 'Discover public evidence for a target project.',
      },
      {
        id: 'acedata.webextrator.extract',
        protocolId: 'acedata-cloud',
        version: '1.0.0',
        description: 'Extract structured evidence from selected URLs.',
      },
      {
        id: 'acedata.openai.chat.completions',
        protocolId: 'acedata-cloud',
        version: '1.0.0',
        description: 'Synthesize findings into an actionable due-diligence report.',
      },
    ],
    pricing: [
      {
        tierId: 'standard',
        pricePerCall: 1000,
        rateLimit: 30,
        tokenType: 'usdc',
        settlementMode: 'x402',
      },
    ],
  };

  return manifest;
}

export function validateSapManifest(manifest) {
  if (typeof sap.validateAgentInput === 'function') {
    const result = sap.validateAgentInput({
      name: manifest.name,
      endpointUri: manifest.x402Endpoint,
    });
    if (result && result.ok === false) {
      throw new Error(`SAP manifest validation failed: ${result.errors.join('; ')}`);
    }
  }
  return true;
}

export function getSapSdkStatus() {
  return {
    package: '@oobe-protocol-labs/synapse-sap-sdk',
    programId: sap.PROGRAM_ID?.toString?.() || String(sap.PROGRAM_ID),
    hasPdaHelpers: Boolean(sap.Pdas?.getAgentPDA),
    hasValidator: typeof sap.validateAgentInput === 'function',
  };
}
