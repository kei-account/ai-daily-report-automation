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
  const firstTitle = items[0]?.title || 'AI 新闻不算少';
  const secondTitle = items[1]?.title || '资本市场也没闲着';
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
    opening_line: `今天的 AI 圈关键词有点密：${firstTitle}。另一边，${secondTitle} 也在提醒市场，AI 叙事不能只看热闹，还要看谁能把能力变成收入、效率和估值支撑。技术和资本继续互相递话筒，但今天更值得看的是谁真的接得住。`,
    daily_summary: `过去 ${newsBundle.lookback_hours || 24} 小时内，AI 技术侧主要围绕「${firstTitle}」展开；投资侧则需要结合「${secondTitle}」观察市场对 AI 商业化和资本回报的判断。`,
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
  "opening_line": "A 2-3 sentence internet-style Simplified Chinese opening comment based on today's actual news.",
  "daily_summary": "A concise Simplified Chinese summary of today's information based only on the selected last-24h items.",
  "ai_technology": [
    {"topic": "...", "summary": "...", "impact": "...", "source": "...", "source_published_at": "ISO-8601 timestamp"}
  ],
  "pe_investment": [
    {"topic": "...", "amount": "", "summary": "...", "impact": "...", "source": "...", "source_published_at": "ISO-8601 timestamp"}
  ]
}

Rules:
- Write all topic, summary, and impact fields in Simplified Chinese.
- opening_line must be based on today's selected news, written as 2-3 concise internet-style sentences: lively, specific, slightly witty, and information-dense, but not clickbait and not childish. It must not reuse generic templates such as "技术在赶路，资本在看路牌".
- daily_summary must summarize today's actual information signals, not explain the report rules. It should mention both AI technology and PE/investment angles when data is available, and it must be specific to today's selected items.
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
