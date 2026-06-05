const fs = require('fs');
const OpenAI = require('openai');

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Model response did not contain JSON.');
  }
  return JSON.parse(match[0]);
}

function fallbackResearch(newsBundle) {
  const items = newsBundle.items || [];
  const silicon = items.slice(0, 3).map(item => ({
    topic: item.title,
    summary: item.summary || item.title,
    impact: '需继续观察其对 AI 产品、平台生态和企业采用节奏的影响。',
    source: item.link
  }));

  const wallStreet = items.slice(3, 6).map(item => ({
    topic: item.title,
    amount: '',
    summary: item.summary || item.title,
    impact: '需继续观察其对资本市场、AI 投资和企业部署的影响。',
    source: item.link
  }));

  return {
    date: newsBundle.date,
    silicon_valley: silicon,
    wall_street_pe: wallStreet
  };
}

async function buildResearchData(newsBundle, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is missing. Falling back to raw RSS summaries.');
    return fallbackResearch(newsBundle);
  }

  const requirements = fs.readFileSync(options.requirementsPath || 'config/report_requirements.md', 'utf8');
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  const prompt = `You are preparing a daily AI intelligence report.

Requirements:
${requirements}

Today's date: ${newsBundle.date}

Available news/RSS items:
${JSON.stringify(newsBundle.items, null, 2)}

Return JSON only, with this exact shape:
{
  "date": "YYYY-MM-DD",
  "silicon_valley": [
    {"topic": "...", "summary": "...", "impact": "...", "source": "..."}
  ],
  "wall_street_pe": [
    {"topic": "...", "amount": "", "summary": "...", "impact": "...", "source": "..."}
  ]
}

Rules:
- Write all topic, summary, and impact fields in Simplified Chinese.
- Select 3 items for silicon_valley and 3 items for wall_street_pe when possible.
- Preserve source URLs from the input.
- Do not invent facts, deal amounts, or source URLs.
- If amount is unknown, use an empty string.
- Prefer current and reliable items.`;

  const response = await client.responses.create({
    model,
    input: prompt,
    temperature: 0.2
  });

  const text = response.output_text || '';
  return extractJson(text);
}

module.exports = { buildResearchData };
