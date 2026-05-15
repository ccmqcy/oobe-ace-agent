import { loadConfig, requireLiveConfig } from './config.mjs';
import { runAgentWorkflow } from './agent-workflow.mjs';

async function main() {
  const config = loadConfig();
  requireLiveConfig(config);
  const result = await runAgentWorkflow(config);

  console.log(JSON.stringify({
    status: 'ok',
    mode: config.mode,
    target: config.target,
    runDir: result.runDir,
    requiredServices: result.trace.aceResults.map((entry) => entry.service),
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});

