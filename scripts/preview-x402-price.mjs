const baseURL = 'https://api.acedata.cloud';

const probes = [
  {
    name: 'serp.google',
    path: '/serp/google',
    body: { query: 'OOBE Protocol autonomous agent', type: 'search', country: 'us', language: 'en' },
  },
  {
    name: 'webextrator.extract',
    path: '/webextrator/extract',
    body: { url: 'https://www.oobeprotocol.ai/', expected_type: 'general', enable_llm: true },
  },
  {
    name: 'openai.chat.completions',
    path: '/openai/chat/completions',
    body: {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hi in five words.' }],
      max_tokens: 20,
    },
  },
];

async function probe({ name, path, body }) {
  const response = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
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
    name,
    status: response.status,
    accepts: parsed.accepts || null,
    error: parsed.error || null,
  };
}

const results = [];
for (const item of probes) {
  results.push(await probe(item));
}
console.log(JSON.stringify(results, null, 2));

