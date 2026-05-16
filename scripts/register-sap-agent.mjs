import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadConfig } from '../src/config.mjs';
import { buildSapAgentManifest, validateSapManifest } from '../src/sap-registry.mjs';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const { SapConnection } = require(path.join(projectRoot, 'node_modules/@oobe-protocol-labs/synapse-sap-sdk/dist/cjs/core/connection.js'));

const args = parseArgs(process.argv.slice(2));
const shouldSend = Boolean(args.send);
const dryRun = !shouldSend;
const config = loadConfig([]);

if (!config.sap.rpcUrl) {
  throw new Error('SYNAPSE_RPC_URL is required for SAP mainnet registration.');
}
if (!config.sap.keypairPath) {
  throw new Error('SAP_AGENT_KEYPAIR_PATH is required. Run npm run sap:keypair first.');
}

const keypairPath = path.resolve(config.sap.keypairPath);
const keypair = await loadKeypair(keypairPath);
const manifest = buildSapAgentManifest({
  ...config,
  sap: {
    ...config.sap,
    publicKey: keypair.publicKey.toBase58(),
  },
});
validateSapManifest(manifest);

const conn = SapConnection.fromKeypair(config.sap.rpcUrl, keypair, {
  cluster: 'mainnet-beta',
  commitment: 'confirmed',
});
const agentUri = manifest.agentUri || config.sap.agentUri;
const x402Endpoint = manifest.x402Endpoint || config.sap.endpoint;
const balanceLamports = await conn.connection.getBalance(keypair.publicKey, 'confirmed');
const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
const minBalanceSol = Number(process.env.SAP_MIN_BALANCE_SOL || '0.01');
const existing = await fetchExisting(conn.client, keypair.publicKey);
const registration = {
  name: manifest.name,
  description: manifest.description,
  agentId: `did:sap:${keypair.publicKey.toBase58()}`,
  agentUri,
  x402Endpoint,
  capabilities: manifest.capabilities,
  protocols: manifest.protocols,
  pricing: manifest.pricing,
};

const outputRoot = path.resolve(config.outputRoot || 'runs');
const runId = `${dryRun ? 'sap-registration-dry-run' : 'sap-registration'}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const runDir = path.join(outputRoot, runId);
await mkdir(runDir, { recursive: true });

if (dryRun || existing) {
  const summary = {
    ok: true,
    dryRun,
    sent: false,
    alreadyRegistered: Boolean(existing),
    keypairPath,
    publicKey: keypair.publicKey.toBase58(),
    rpcUrl: redactRpc(config.sap.rpcUrl),
    balanceSol,
    minBalanceSol,
    agentPda: manifest.agentPda,
    registration,
  };
  await writeFile(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({
    ...summary,
    runDir,
    next: existing
      ? 'Agent appears registered. Run npm run sap:check and attach the evidence.'
      : 'Dry run only. Fund the public key if needed, then run npm run sap:register to send the transaction.',
  }, null, 2));
} else {
  if (balanceSol < minBalanceSol) {
    throw new Error(`SAP burner balance is ${balanceSol} SOL, below SAP_MIN_BALANCE_SOL=${minBalanceSol}. Fund ${keypair.publicKey.toBase58()} first.`);
  }

  const builder = conn.client.builder
    .agent(registration.name)
    .description(registration.description)
    .agentId(registration.agentId)
    .agentUri(registration.agentUri)
    .x402Endpoint(registration.x402Endpoint);

  for (const capability of registration.capabilities) {
    builder.addCapability(capability.id, {
      protocol: capability.protocolId,
      version: capability.version,
      description: capability.description,
    });
  }
  for (const protocol of registration.protocols) {
    builder.addProtocol(protocol);
  }
  builder.addPricingTier({
    tierId: 'standard',
    pricePerCall: 1000,
    rateLimit: 30,
    tokenType: 'usdc',
    settlementMode: 'x402',
  });

  const result = await builder.register();
  const summary = {
    ok: true,
    dryRun: false,
    sent: true,
    publicKey: keypair.publicKey.toBase58(),
    rpcUrl: redactRpc(config.sap.rpcUrl),
    balanceSolBefore: balanceSol,
    txSignature: result.txSignature,
    agentPda: result.agentPda.toBase58(),
    statsPda: result.statsPda.toBase58(),
    registration,
  };
  await writeFile(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, runDir }, null, 2));
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      result[key] = true;
    } else {
      result[key] = next;
      i += 1;
    }
  }
  return result;
}

async function loadKeypair(filePath) {
  const raw = JSON.parse(await readFile(filePath, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function fetchExisting(client, walletPublicKey) {
  try {
    return await client.agent.fetchNullable(walletPublicKey);
  } catch {
    return null;
  }
}

function redactRpc(url) {
  return String(url).replace(/api_key=([^&]+)/i, 'api_key=redacted');
}
