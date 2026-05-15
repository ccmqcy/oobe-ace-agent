import { verifyTypedData } from 'ethers';

const connectButton = document.querySelector('#connect');
const runButton = document.querySelector('#run');
const targetInput = document.querySelector('#target');
const statusEl = document.querySelector('#status');
const traceEl = document.querySelector('#trace');

let account = '';

function addStatus(text) {
  const item = document.createElement('div');
  item.textContent = text;
  statusEl.prepend(item);
}

function setTrace(value) {
  traceEl.textContent = JSON.stringify(value, null, 2);
}

async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask was not detected in this browser profile.');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  account = accounts[0];

  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== '0x2105') {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }],
    });
  }

  connectButton.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
  runButton.disabled = false;
  addStatus(`Connected ${account} on Base.`);
}

async function serverJson(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok || json.ok === false) {
    throw new Error(json.error || `Request failed: ${response.status}`);
  }
  return json;
}

async function runPaidService(service, body, paymentHandler) {
  addStatus(`Requesting x402 quote for ${service}...`);
  const quote = await serverJson('/api/x402/quote', { service, body });
  if (!quote.paymentRequired) {
    addStatus(`${service} returned without payment.`);
    return quote.result;
  }

  const baseRequirement = quote.accepts.find((entry) => entry.network === 'base');
  if (!baseRequirement) {
    throw new Error(`${service} did not offer Base x402 payment.`);
  }
  const usdc = Number(baseRequirement.maxAmountRequired) / 1_000_000;
  addStatus(`Sign ${service} payment: ${usdc} USDC.`);

  const payment = await paymentHandler(baseRequirement);

  const executed = await serverJson('/api/x402/execute', {
    service,
    body,
    xPayment: payment.headers['X-Payment'],
  });
  addStatus(`${service} completed.`);
  return executed.result;
}

async function runDemo() {
  runButton.disabled = true;
  const target = targetInput.value.trim() || 'OOBE Protocol';
  const latestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  account = latestAccounts[0];
  const paymentHandler = (requirement) => signBaseX402Payment(requirement, account);

  try {
    const searchBody = {
      query: `${target} OOBE Protocol Ace Data Cloud autonomous agent Solana`,
      type: 'search',
      country: 'us',
      language: 'en',
      page: 1,
    };
    const search = await runPaidService('serp.google', searchBody, paymentHandler);
    setTrace({ target, wallet: account, step: 'search', search });

    const firstUrl = firstSearchUrl(search) || 'https://www.oobeprotocol.ai/';
    const extractBody = {
      url: firstUrl,
      expected_type: 'general',
      enable_llm: true,
      timeout: 45000,
    };
    const extraction = await runPaidService('webextrator.extract', extractBody, paymentHandler);
    setTrace({ target, wallet: account, step: 'extract', firstUrl, search, extraction });

    const chatBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an autonomous web3 due-diligence agent. Return concise JSON-friendly findings.',
        },
        {
          role: 'user',
          content: [
            `Target: ${target}`,
            'Summarize opportunity, risks, and next actions from the evidence.',
            `Search evidence: ${JSON.stringify(search).slice(0, 5000)}`,
            `Extraction evidence: ${JSON.stringify(extraction).slice(0, 5000)}`,
          ].join('\n'),
        },
      ],
      max_tokens: 600,
    };
    const synthesis = await runPaidService('openai.chat.completions', chatBody, paymentHandler);

    const saved = await serverJson('/api/x402/save', {
      wallet: account,
      target,
      aceResults: [
        { service: 'acedata.serp.google', mode: 'x402', input: { target }, output: search },
        { service: 'acedata.webextrator.extract', mode: 'x402', input: { url: firstUrl }, output: extraction },
        { service: 'acedata.openai.chat.completions', mode: 'x402', input: { model: 'gpt-4o-mini' }, output: synthesis },
      ],
    });

    const trace = { target, wallet: account, firstUrl, search, extraction, synthesis, saved };
    setTrace(trace);
    addStatus(`Saved x402 evidence: ${saved.runDir}`);
  } finally {
    runButton.disabled = false;
  }
}

async function signBaseX402Payment(requirement, signerAddress) {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== '0x2105') {
    throw new Error(`Expected Base chain 0x2105, got ${chainId}.`);
  }

  const now = Math.floor(Date.now() / 1000);
  const maxTimeout = requirement.maxTimeoutSeconds || 120;
  const authorization = {
    from: signerAddress,
    to: requirement.payTo,
    value: BigInt(requirement.maxAmountRequired).toString(),
    validAfter: String(now),
    validBefore: String(now + maxTimeout),
    nonce: randomNonce32(),
  };
  const domain = {
    name: requirement.extra?.name || 'USD Coin',
    version: requirement.extra?.version || '2',
    chainId: requirement.extra?.chainId || 8453,
    verifyingContract: requirement.extra?.verifyingContract || requirement.asset,
  };
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };
  const typedDataForMetaMask = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ...types,
    },
    primaryType: 'TransferWithAuthorization',
    domain,
    message: authorization,
  };

  const signature = await window.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [signerAddress, JSON.stringify(typedDataForMetaMask)],
  });
  const recovered = verifyTypedData(domain, types, authorization, signature);
  if (recovered.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error(`Local signature mismatch; expected ${signerAddress}, got ${recovered}`);
  }

  const envelope = {
    x402Version: 2,
    scheme: requirement.scheme || 'exact',
    network: requirement.network || 'base',
    payload: { authorization, signature },
  };
  return {
    headers: {
      'X-Payment': btoa(JSON.stringify(envelope)),
    },
    recovered,
  };
}

function randomNonce32() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function firstSearchUrl(search) {
  const candidates = [
    search?.organic,
    search?.organic_results,
    search?.data?.organic,
    search?.data?.organic_results,
    search?.results,
  ].find(Array.isArray);
  const first = candidates?.[0];
  return first?.url || first?.link || first?.href || null;
}

connectButton.addEventListener('click', () => connectWallet().catch((error) => addStatus(error.message)));
runButton.addEventListener('click', () => runDemo().catch((error) => {
  addStatus(error.message);
  runButton.disabled = false;
}));
