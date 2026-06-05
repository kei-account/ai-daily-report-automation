const fs = require('fs');

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
  const aiTechnology = items.slice(0, 3).map(item => ({
    topic: item.title,
    summary: item.summary || item.title,
    impact: '需继续观察其对 AI 技术路线、产品平台和企业采用节奏的影响。',
    source: item.link,
    source_published_at: item.published_at
  }));

  const peInvestment = items.slice(3, 6).map(item => ({
    topic: item.title,
    amount: '',
    summary: item.summary || item.title,
    impact: '需继续观察其对资本市场、PE 投资和企业 AI 部署的影响。',
    source: item.link,
    source_published_at: item.published_at
  }));

  return {
    date: newsBundle.date,
    lookback_hours: newsBundle.lookback_hours || 24,
    generated_at: newsBundle.generated_at,
    ai_technology: aiTechnology,
    pe_investment: peInvestment
  };
}

async function buildResearchData(newsBundle, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is missing. Falling back to raw RSS summaries.');
    return fallbackResearch(newsBundle);
  }

  const requirements = fs.readFileSync(options.requirementsPath || 'config/report_requirements.md', 'utf8');
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  const prompt = `You are preparing a daily AI intelligence report.

Requirements:
${requirements}

Today's date: ${newsBundle.date}
Report generation time: ${newsBundle.generated_at}
Only use items within the last ${newsBundle.lookback_hours || 24} hours. The provided list has already been filtered, but you must still preserve and display each item's source_published_at.

Available news/RSS items:
${JSON.stringify(newsBundle.items, null, 2)}

Return JSON only, with this exact shape:
{
  "date": "YYYY-MM-DD",
  "lookback_hours": 24,
  "generated_at": "ISO-8601 timestamp",
  "ai_technology": [
    {"topic": "...", "summary": "...", "impact": "...", "source": "...", "source_published_at": "ISO-8601 timestamp"}
  ],
  "pe_investment": [
    {"topic": "...", "amount": "", "summary": "...", "impact": "...", "source": "...", "source_published_at": "ISO-8601 timestamp"}
  ]
}

Rules:
- Write all topic, summary, and impact fields in Simplified Chinese.
- Select up to 3 items for ai_technology and up to 3 items for pe_investment when possible.
- Preserve source URLs and source_published_at timestamps from the input.
- Do not invent facts, deal amounts, or source URLs.
- If amount is unknown, use an empty string.
- Every selected item must be from the last ${newsBundle.lookback_hours || 24} hours.
- Summarize based only on the latest items provided.`;

  const response = await client.responses.create({
    model,
    input: prompt,
    temperature: 0.2
  });

  const text = response.output_text || '';
  return extractJson(text);
}

module.exports = { buildResearchData };
