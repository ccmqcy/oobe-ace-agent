import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runAceServices } from './ace-client.mjs';
import { buildSapAgentManifest, validateSapManifest, getSapSdkStatus } from './sap-registry.mjs';

export async function runAgentWorkflow(config) {
  const startedAt = new Date();
  const runId = startedAt.toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(config.outputRoot, runId);
  await mkdir(runDir, { recursive: true });

  const sapStatus = getSapSdkStatus();
  const manifest = buildSapAgentManifest(config);
  validateSapManifest(manifest);

  const toolPlan = selectTools(manifest);
  const aceResults = await runAceServices({ config, target: config.target });
  const report = buildReport({ config, manifest, sapStatus, toolPlan, aceResults, startedAt });

  const trace = {
    runId,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    mode: config.mode,
    target: config.target,
    bountyCategory: 'Ace Data Cloud Usage via x402 facilitator',
    paymentMode: config.mode === 'live' ? config.ace.paymentMode : 'mock',
    sapStatus,
    manifest,
    toolPlan,
    aceResults,
    report,
  };

  await writeFile(path.join(runDir, 'trace.json'), JSON.stringify(trace, null, 2));
  await writeFile(path.join(runDir, 'report.md'), report);
  await writeFile(path.join(runDir, 'sap-agent-manifest.json'), JSON.stringify(manifest, null, 2));

  return { runId, runDir, trace };
}

function selectTools(manifest) {
  return manifest.capabilities.map((capability, index) => ({
    order: index + 1,
    id: capability.id,
    protocolId: capability.protocolId,
    reason: toolReason(capability.id),
  }));
}

function toolReason(id) {
  const reasons = {
    'acedata.serp.google': 'Find public evidence and current references without manual browsing.',
    'acedata.webextrator.extract': 'Convert a selected source into structured evidence for downstream reasoning.',
    'acedata.openai.chat.completions': 'Synthesize the collected evidence into a concise autonomous report.',
  };
  return reasons[id] || 'Selected from the SAP tool manifest.';
}

function buildReport({ config, manifest, sapStatus, toolPlan, aceResults, startedAt }) {
  const summary = extractSynthesis(aceResults);
  return [
    `# AceIntelAgent Run Report`,
    ``,
    `- Target: ${config.target}`,
    `- Mode: ${config.mode}`,
    `- Bounty category: Ace Data Cloud Usage via x402 facilitator`,
    `- Started: ${startedAt.toISOString()}`,
    `- SAP SDK: ${sapStatus.package} (${sapStatus.programId})`,
    `- Agent PDA: ${manifest.agentPda}`,
    `- Payment mode: ${config.mode === 'live' ? config.ace.paymentMode : 'mock'}`,
    ``,
    `## Autonomous Flow`,
    ``,
    `The agent selected ${toolPlan.length} SAP-compatible tools, executed three AceDataCloud services, and produced this report without manual edits during the run.`,
    ``,
    `## Tool Selection`,
    ``,
    ...toolPlan.map((tool) => `${tool.order}. ${tool.id} - ${tool.reason}`),
    ``,
    `## AceDataCloud Service Evidence`,
    ``,
    ...aceResults.map((result, index) => [
      `### ${index + 1}. ${result.service}`,
      ``,
      `- Mode: ${result.mode}`,
      `- Input: \`${JSON.stringify(result.input)}\``,
      `- Output keys: ${Object.keys(result.output || {}).join(', ') || 'none'}`,
      ``,
    ].join('\n')),
    `## Synthesis`,
    ``,
    summary,
    ``,
    `## Submission Notes`,
    ``,
    `For the final bounty submission, record a short demo showing this CLI run, the generated trace, the SAP manifest, and the AceDataCloud x402 transaction headers or settlement hashes from live mode.`,
    ``,
  ].join('\n');
}

function extractSynthesis(aceResults) {
  const chat = aceResults.find((entry) => entry.service.includes('chat.completions'));
  return chat?.output?.choices?.[0]?.message?.content || 'No synthesis text found in the chat completion result.';
}

