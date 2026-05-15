import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Keypair, PublicKey } from '@solana/web3.js';
import { loadConfig } from '../src/config.mjs';
import { buildSapAgentManifest } from '../src/sap-registry.mjs';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const config = loadConfig([]);

if (!config.sap.rpcUrl) {
  throw new Error('SYNAPSE_RPC_URL is required to check SAP registration.');
}

const publicKey = await resolvePublicKey(config);
const sap = importSapSdk();
const client = new sap.SapClient({ rpcUrl: config.sap.rpcUrl });
const [agentPda] = sap.Pdas.getAgentPDA(publicKey);
const [statsPda] = sap.Pdas.getAgentStatsPDA(agentPda);

const agent = await client.fetchAccount('agentAccount', agentPda);
const stats = await client.fetchAccount('agentStats', statsPda);
const manifest = buildSapAgentManifest({
  ...config,
  sap: {
    ...config.sap,
    publicKey: publicKey.toBase58(),
  },
});

const evidence = {
  ok: Boolean(agent),
  checkedAt: new Date().toISOString(),
  publicKey: publicKey.toBase58(),
  rpcUrl: redactRpc(config.sap.rpcUrl),
  agentPda: agentPda.toBase58(),
  statsPda: statsPda.toBase58(),
  manifest,
  agent: serialize(agent),
  stats: serialize(stats),
};

const runId = `sap-check-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const runDir = path.resolve(config.outputRoot || 'runs', runId);
await mkdir(runDir, { recursive: true });
await writeFile(path.join(runDir, 'summary.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ ...evidence, runDir }, null, 2));

async function resolvePublicKey(currentConfig) {
  if (currentConfig.sap.publicKey) return new PublicKey(currentConfig.sap.publicKey);
  if (!currentConfig.sap.keypairPath) {
    throw new Error('Set SAP_AGENT_PUBLIC_KEY or SAP_AGENT_KEYPAIR_PATH before checking registration.');
  }
  const raw = JSON.parse(await readFile(path.resolve(currentConfig.sap.keypairPath), 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(raw)).publicKey;
}

function importSapSdk() {
  return require(path.join(projectRoot, 'node_modules/@oobe-protocol-labs/synapse-sap-sdk/dist/cjs/index.js'));
}

function serialize(value) {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value, (_key, entry) => {
    if (typeof entry === 'bigint') return entry.toString();
    if (entry && typeof entry.toBase58 === 'function') return entry.toBase58();
    if (entry && typeof entry.toString === 'function' && entry.constructor?.name === 'BN') return entry.toString();
    return entry;
  }));
}

function redactRpc(url) {
  return String(url).replace(/api_key=([^&]+)/i, 'api_key=redacted');
}
