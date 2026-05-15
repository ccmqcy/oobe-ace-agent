import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig, requireLiveConfig } from './config.mjs';
import { runAgentWorkflow } from './agent-workflow.mjs';
import { buildSapAgentManifest, getSapSdkStatus } from './sap-registry.mjs';

const config = loadConfig();
const port = Number(process.env.PORT || 8787);
const aceBaseUrl = 'https://api.acedata.cloud';
const publicDir = path.resolve('public');

const aceServices = {
  'serp.google': '/serp/google',
  'webextrator.extract': '/webextrator/extract',
  'openai.chat.completions': '/openai/chat/completions',
};

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function callAce(service, body, xPayment) {
  const endpoint = aceServices[service];
  if (!endpoint) throw new Error(`Unsupported service: ${service}`);
  const response = await fetch(`${aceBaseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(xPayment ? { 'X-Payment': xPayment } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    url: `${aceBaseUrl}${endpoint}`,
    headers: {
      x402Tx: response.headers.get('x402_tx') || response.headers.get('x-402-tx') || null,
      traceId: response.headers.get('x-trace-id') || response.headers.get('trace-id') || null,
    },
    parsed,
  };
}

async function saveX402Run({ wallet, target, aceResults }) {
  const startedAt = new Date();
  const runId = `x402-${startedAt.toISOString().replace(/[:.]/g, '-')}`;
  const runDir = path.join(config.outputRoot, runId);
  await mkdir(runDir, { recursive: true });
  const sapStatus = getSapSdkStatus();
  const manifest = buildSapAgentManifest(config);
  const report = buildX402Report({ wallet, target, aceResults, sapStatus, manifest, startedAt });
  const trace = {
    runId,
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    mode: 'live',
    paymentMode: 'x402-browser-metamask',
    wallet,
    target,
    bountyCategory: 'Ace Data Cloud Usage via x402 facilitator',
    sapStatus,
    manifest,
    aceResults,
    report,
  };
  await writeFile(path.join(runDir, 'trace.json'), JSON.stringify(trace, null, 2));
  await writeFile(path.join(runDir, 'report.md'), report);
  await writeFile(path.join(runDir, 'sap-agent-manifest.json'), JSON.stringify(manifest, null, 2));
  return { runId, runDir };
}

function buildX402Report({ wallet, target, aceResults, sapStatus, manifest, startedAt }) {
  const synthesis = aceResults.find((entry) => entry.service.includes('chat.completions'))?.output?.choices?.[0]?.message?.content || 'No synthesis returned.';
  return [
    '# AceIntelAgent x402 Run Report',
    '',
    `- Target: ${target}`,
    `- Mode: live`,
    `- Payment mode: x402-browser-metamask`,
    `- Wallet: ${wallet}`,
    `- Started: ${startedAt.toISOString()}`,
    `- SAP SDK: ${sapStatus.package} (${sapStatus.programId})`,
    `- Agent PDA: ${manifest.agentPda}`,
    '',
    '## Services',
    '',
    ...aceResults.map((result, index) => [
      `### ${index + 1}. ${result.service}`,
      '',
      `- Mode: ${result.mode}`,
      `- Input: \`${JSON.stringify(result.input)}\``,
      `- Output keys: ${Object.keys(result.output || {}).join(', ') || 'none'}`,
      '',
    ].join('\n')),
    '## Synthesis',
    '',
    synthesis,
    '',
  ].join('\n');
}

async function serveStatic(url, response) {
  const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) {
    sendJson(response, 403, { ok: false, error: 'forbidden' });
    return true;
  }
  try {
    const content = await readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
    }[ext] || 'application/octet-stream';
    response.writeHead(200, { 'content-type': contentType });
    response.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, {
        ok: true,
        agent: 'AceIntelAgent',
        mode: config.mode,
        sap: getSapSdkStatus(),
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/sap/manifest') {
      sendJson(response, 200, buildSapAgentManifest(config));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/x402/quote') {
      const body = await readJson(request);
      const result = await callAce(body.service, body.body, null);
      if (result.status === 402) {
        sendJson(response, 200, {
          ok: true,
          paymentRequired: true,
          service: body.service,
          url: result.url,
          accepts: result.parsed.accepts || [],
          error: result.parsed.error || null,
        });
        return;
      }
      sendJson(response, 200, {
        ok: true,
        paymentRequired: false,
        service: body.service,
        result: result.parsed,
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/x402/execute') {
      const body = await readJson(request);
      const result = await callAce(body.service, body.body, body.xPayment);
      if (!result.ok) {
        sendJson(response, result.status, {
          ok: false,
          status: result.status,
          error: result.parsed?.error || result.parsed,
        });
        return;
      }
      sendJson(response, 200, {
        ok: true,
        service: body.service,
        headers: result.headers,
        result: result.parsed,
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/x402/save') {
      const body = await readJson(request);
      const saved = await saveX402Run(body);
      sendJson(response, 200, { ok: true, ...saved });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/run') {
      const body = await readJson(request);
      const runConfig = {
        ...config,
        target: body.target || config.target,
        mode: body.mode || config.mode,
      };
      requireLiveConfig(runConfig);
      const result = await runAgentWorkflow(runConfig);
      sendJson(response, 200, {
        ok: true,
        runDir: result.runDir,
        services: result.trace.aceResults.map((entry) => entry.service),
      });
      return;
    }

    if (request.method === 'GET' && await serveStatic(url, response)) {
      return;
    }

    sendJson(response, 404, { ok: false, error: 'not_found' });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message });
  }
});

server.listen(port, () => {
  console.log(JSON.stringify({
    status: 'listening',
    url: `http://localhost:${port}`,
    endpoints: ['/health', '/sap/manifest', '/run'],
  }, null, 2));
});
