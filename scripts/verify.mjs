import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runAgentWorkflow } from '../src/agent-workflow.mjs';
import { loadConfig } from '../src/config.mjs';

const require = createRequire(import.meta.url);

async function assertImport(name, loader) {
  try {
    await loader();
    return { name, ok: true };
  } catch (error) {
    return { name, ok: false, error: error.message };
  }
}

async function main() {
  const importChecks = await Promise.all([
    assertImport('@acedatacloud/sdk', () => import('@acedatacloud/sdk')),
    assertImport('@acedatacloud/x402-client', () => import('@acedatacloud/x402-client')),
    assertImport('@oobe-protocol-labs/synapse-client-sdk', () => import('@oobe-protocol-labs/synapse-client-sdk')),
    assertImport('@oobe-protocol-labs/synapse-sap-sdk:cjs', async () => require('@oobe-protocol-labs/synapse-sap-sdk')),
  ]);

  const failedImports = importChecks.filter((entry) => !entry.ok);
  if (failedImports.length) {
    throw new Error(`Import checks failed: ${JSON.stringify(failedImports, null, 2)}`);
  }

  const config = loadConfig(['--mode', 'mock', '--target', 'OOBE Protocol']);
  const result = await runAgentWorkflow(config);
  const tracePath = `${result.runDir}/trace.json`;
  await access(tracePath);

  const trace = JSON.parse(await readFile(tracePath, 'utf8'));
  const services = trace.aceResults.map((entry) => entry.service);
  const required = [
    'acedata.serp.google',
    'acedata.webextrator.extract',
    'acedata.openai.chat.completions',
  ];
  const missing = required.filter((service) => !services.includes(service));
  if (missing.length) {
    throw new Error(`Missing required AceDataCloud services: ${missing.join(', ')}`);
  }

  console.log(JSON.stringify({
    status: 'verified',
    imports: importChecks,
    runDir: result.runDir,
    services,
    sapProgramId: trace.sapStatus.programId,
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

