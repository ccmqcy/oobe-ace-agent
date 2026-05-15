import { AceDataCloud } from '@acedatacloud/sdk';
import { createX402PaymentHandler } from '@acedatacloud/x402-client';
import { Wallet } from 'ethers';

function createEip1193WalletProvider(privateKey) {
  const wallet = new Wallet(privateKey);
  return {
    address: wallet.address,
    async request({ method, params }) {
      if (method !== 'eth_signTypedData_v4') {
        throw new Error(`Unsupported EIP-1193 method: ${method}`);
      }
      const [address, payload] = params;
      if (address.toLowerCase() !== wallet.address.toLowerCase()) {
        throw new Error('x402 signing address does not match the configured burner wallet.');
      }
      const typedData = JSON.parse(payload);
      const types = { ...typedData.types };
      delete types.EIP712Domain;
      return wallet.signTypedData(typedData.domain, types, typedData.message);
    },
  };
}

export function createAceClient(config) {
  if (config.mode !== 'live') return null;

  if (config.ace.paymentMode === 'token') {
    return new AceDataCloud({ apiToken: config.ace.apiToken });
  }

  if (config.ace.paymentMode === 'x402') {
    const provider = createEip1193WalletProvider(config.ace.evmPrivateKey);
    return new AceDataCloud({
      paymentHandler: createX402PaymentHandler({
        network: config.ace.x402Network,
        evmProvider: provider,
        evmAddress: provider.address,
      }),
    });
  }

  throw new Error(`Unsupported ACE_PAYMENT_MODE: ${config.ace.paymentMode}`);
}

export async function runAceServices({ config, target }) {
  if (config.mode !== 'live') {
    return runMockAceServices(target);
  }

  const client = createAceClient(config);
  const search = await client.search.google({
    query: `${target} OOBE Protocol Ace Data Cloud autonomous agent Solana`,
    type: 'search',
    country: 'us',
    language: 'en',
    page: 1,
  });

  const firstUrl = extractFirstUrl(search) || 'https://www.oobeprotocol.ai/';
  const extraction = await client.webextrator.extract({
    url: firstUrl,
    expectedType: 'general',
    enableLlm: true,
    timeout: 45000,
  });

  const synthesis = await client.openai.chat.completions.create({
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
          'Summarize the opportunity, risks, and a next action plan from the search and extraction evidence.',
          `Search evidence: ${JSON.stringify(search).slice(0, 5000)}`,
          `Extraction evidence: ${JSON.stringify(extraction).slice(0, 5000)}`,
        ].join('\n'),
      },
    ],
    max_tokens: 600,
  });

  return [
    {
      service: 'acedata.serp.google',
      mode: 'live',
      input: { target },
      output: compact(search),
    },
    {
      service: 'acedata.webextrator.extract',
      mode: 'live',
      input: { url: firstUrl },
      output: compact(extraction),
    },
    {
      service: 'acedata.openai.chat.completions',
      mode: 'live',
      input: { model: 'gpt-4o-mini' },
      output: compact(synthesis),
    },
  ];
}

function runMockAceServices(target) {
  return [
    {
      service: 'acedata.serp.google',
      mode: 'mock',
      input: { target },
      output: {
        organic_results: [
          {
            title: `${target} official protocol resources`,
            url: 'https://www.oobeprotocol.ai/',
            snippet: 'Protocol resources indicate SAP, x402 payments, and agent discovery primitives.',
          },
        ],
      },
    },
    {
      service: 'acedata.webextrator.extract',
      mode: 'mock',
      input: { url: 'https://www.oobeprotocol.ai/' },
      output: {
        title: `${target} infrastructure brief`,
        summary: 'The target exposes agent registration, tool discovery, and payment settlement resources.',
      },
    },
    {
      service: 'acedata.openai.chat.completions',
      mode: 'mock',
      input: { model: 'gpt-4o-mini' },
      output: {
        choices: [
          {
            message: {
              content: 'The autonomous agent should collect evidence, verify tool availability, execute paid AceDataCloud calls, and produce a signed trace for review.',
            },
          },
        ],
      },
    },
  ];
}

function extractFirstUrl(search) {
  const candidates = [
    search?.organic_results,
    search?.data?.organic_results,
    search?.results,
  ].find(Array.isArray);
  const first = candidates?.[0];
  return first?.url || first?.link || first?.href || null;
}

function compact(value) {
  return JSON.parse(JSON.stringify(value, (_key, entry) => {
    if (typeof entry === 'string' && entry.length > 6000) return `${entry.slice(0, 6000)}...`;
    return entry;
  }));
}
