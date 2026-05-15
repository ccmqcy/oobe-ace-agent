import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Keypair } from '@solana/web3.js';

const args = parseArgs(process.argv.slice(2));
const keypairPath = path.resolve(args.path || process.env.SAP_AGENT_KEYPAIR_PATH || 'keys/sap-agent.json');

const existing = await readExisting(keypairPath);
if (existing && !args.force) {
  console.log(JSON.stringify({
    ok: true,
    created: false,
    keypairPath,
    publicKey: existing.publicKey.toBase58(),
    note: 'Existing keypair kept. Pass --force only if you intentionally want to replace this burner.',
  }, null, 2));
  process.exit(0);
}

const keypair = Keypair.generate();
await mkdir(path.dirname(keypairPath), { recursive: true });
await writeFile(keypairPath, JSON.stringify(Array.from(keypair.secretKey), null, 2));

console.log(JSON.stringify({
  ok: true,
  created: true,
  keypairPath,
  publicKey: keypair.publicKey.toBase58(),
  next: 'Fund this public key with a small amount of SOL before running npm run sap:register.',
}, null, 2));

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

async function readExisting(filePath) {
  try {
    await access(filePath);
    const raw = JSON.parse(await readFile(filePath, 'utf8'));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  } catch {
    return null;
  }
}
