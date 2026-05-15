import 'dotenv/config';

export function parseArgs(argv = process.argv.slice(2)) {
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

export function loadConfig(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const mode = String(args.mode || process.env.RUN_MODE || 'mock').toLowerCase();
  const target = String(args.target || process.env.AGENT_TARGET || 'OOBE Protocol');

  return {
    mode,
    target,
    outputRoot: process.env.OUTPUT_ROOT || 'runs',
    ace: {
      paymentMode: process.env.ACE_PAYMENT_MODE || 'x402',
      apiToken: process.env.ACEDATACLOUD_API_TOKEN || '',
      x402Network: process.env.ACE_X402_NETWORK || 'base',
      evmPrivateKey: process.env.ACE_EVM_PRIVATE_KEY || '',
    },
    sap: {
      rpcUrl: process.env.SYNAPSE_RPC_URL || '',
      keypairPath: process.env.SAP_AGENT_KEYPAIR_PATH || '',
      publicKey: process.env.SAP_AGENT_PUBLIC_KEY || '',
      endpoint: process.env.SAP_AGENT_ENDPOINT || 'https://example.com/x402',
    },
    submission: {
      githubRepoUrl: process.env.GITHUB_REPO_URL || '',
      demoVideoUrl: process.env.DEMO_VIDEO_URL || '',
      xPostUrl: process.env.X_POST_URL || '',
    },
  };
}

export function requireLiveConfig(config) {
  if (config.mode !== 'live') return;
  if (config.ace.paymentMode === 'token' && !config.ace.apiToken) {
    throw new Error('Live token mode requires ACEDATACLOUD_API_TOKEN.');
  }
  if (config.ace.paymentMode === 'x402' && !config.ace.evmPrivateKey) {
    throw new Error('Live x402 mode requires ACE_EVM_PRIVATE_KEY for a funded burner wallet.');
  }
}

