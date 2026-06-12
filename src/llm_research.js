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
    topic_en: item.title,
    topic_zh: item.title,
    summary: item.summary || item.title,
    summary_en: item.summary || item.title,
    summary_zh: item.summary || item.title,
    key_facts: [item.title, item.summary || item.title].filter(Boolean).slice(0, 2),
    key_facts_en: [item.title, item.summary || item.title].filter(Boolean).slice(0, 2),
    key_facts_zh: [item.title, item.summary || item.title].filter(Boolean).slice(0, 2),
    framework: 'Product analysis: user workflow, capability improvement, distribution, defensibility, and adoption friction.',
    framework_en: 'Product analysis: user workflow, capability improvement, distribution, defensibility, and adoption friction.',
    framework_zh: '产品分析框架：用户场景、能力增量、分发入口、壁垒与采用阻力。',
    impact: 'Needs continued monitoring for AI technology roadmaps, product platforms, and enterprise adoption.',
    impact_en: 'Needs continued monitoring for AI technology roadmaps, product platforms, and enterprise adoption.',
    impact_zh: '需继续观察其对 AI 技术路线、产品平台和企业采用节奏的影响。',
    analysis: 'The item should be read as a signal about whether AI capabilities are moving from demos into repeatable product and workflow patterns.',
    analysis_en: 'The item should be read as a signal about whether AI capabilities are moving from demos into repeatable product and workflow patterns.',
    analysis_zh: '这条信息更适合作为 AI 能力从演示走向可复用产品和工作流的信号来看，而不是单纯看热度。关键在于它是否能改变开发者、企业用户或平台方的实际使用路径。',
    forward_view: 'If similar signals continue, the next phase of AI competition may focus less on model access and more on integration quality, reliability, and workflow ownership.',
    forward_view_en: 'If similar signals continue, the next phase of AI competition may focus less on model access and more on integration quality, reliability, and workflow ownership.',
    forward_view_zh: '如果类似信号持续出现，AI 竞争会从“谁有模型”进一步转向“谁能稳定嵌入业务流程”。这会提升产品集成、可靠性和工作流入口的战略价值。',
    source: item.link,
    source_published_at: item.published_at
  }));

  const peInvestment = items.slice(3, 6).map(item => ({
    topic: item.title,
    topic_en: item.title,
    topic_zh: item.title,
    amount: '',
    summary: item.summary || item.title,
    summary_en: item.summary || item.title,
    summary_zh: item.summary || item.title,
    key_facts: [item.title, item.summary || item.title].filter(Boolean).slice(0, 2),
    key_facts_en: [item.title, item.summary || item.title].filter(Boolean).slice(0, 2),
    key_facts_zh: [item.title, item.summary || item.title].filter(Boolean).slice(0, 2),
    framework: 'PE analysis: market size, growth quality, revenue model, margins, customer concentration, moat, and valuation driver.',
    framework_en: 'PE analysis: market size, growth quality, revenue model, margins, customer concentration, moat, and valuation driver.',
    framework_zh: '投行/PE 分析框架：市场空间、增长质量、收入模式、利润率、客户集中度、护城河与估值驱动。',
    impact: 'Needs continued monitoring for capital markets, PE investment, and enterprise AI deployment.',
    impact_en: 'Needs continued monitoring for capital markets, PE investment, and enterprise AI deployment.',
    impact_zh: '需继续观察其对资本市场、PE 投资和企业 AI 部署的影响。',
    analysis: 'The item matters because investors are increasingly separating AI narrative from measurable monetization, deployment quality, and margin impact.',
    analysis_en: 'The item matters because investors are increasingly separating AI narrative from measurable monetization, deployment quality, and margin impact.',
    analysis_zh: '这条信息的重要性在于，资本正在把 AI 叙事和可量化商业结果分开定价。收入质量、部署深度、利润率改善和客户留存会比单纯“有 AI 概念”更重要。',
    forward_view: 'If this pattern continues, AI investment may concentrate around companies that control enterprise distribution, proprietary data, infrastructure leverage, or clear ROI measurement.',
    forward_view_en: 'If this pattern continues, AI investment may concentrate around companies that control enterprise distribution, proprietary data, infrastructure leverage, or clear ROI measurement.',
    forward_view_zh: '如果这个趋势延续，AI 投资会更集中流向能控制企业分发、专有数据、基础设施杠杆或清晰 ROI 衡量方式的公司。资本会更挑剔，但也会更愿意为确定性付溢价。',
    source: item.link,
    source_published_at: item.published_at
  }));

  return {
    date: newsBundle.date,
    lookback_hours: newsBundle.lookback_hours || 24,
    generated_at: newsBundle.generated_at,
    opening_line: `Today's AI news flow is led by ${firstTitle}. On the capital side, ${secondTitle} is another reminder that the AI narrative needs revenue, efficiency, and valuation support.`,
    opening_line_en: `Today's AI news flow is led by ${firstTitle}. On the capital side, ${secondTitle} is another reminder that the AI narrative needs revenue, efficiency, and valuation support.`,
    opening_line_zh: `今天的 AI 圈关键词有点密：${firstTitle}。另一边，${secondTitle} 也在提醒市场，AI 叙事不能只看热闹，还要看谁能把能力变成收入、效率和估值支撑。技术和资本继续互相递话筒，但今天更值得看的是谁真的接得住。`,
    daily_summary: `Over the last ${newsBundle.lookback_hours || 24} hours, AI technology signals centered on "${firstTitle}", while investment signals should be read alongside "${secondTitle}".`,
    daily_summary_en: `Over the last ${newsBundle.lookback_hours || 24} hours, AI technology signals centered on "${firstTitle}", while investment signals should be read alongside "${secondTitle}".`,
    daily_summary_zh: `过去 ${newsBundle.lookback_hours || 24} 小时内，AI 技术侧主要围绕「${firstTitle}」展开；投资侧则需要结合「${secondTitle}」观察市场对 AI 商业化和资本回报的判断。`,
    framework_analysis: 'Today should be read through the interaction between product deployability and capital discipline.',
    framework_analysis_en: 'Today should be read through the interaction between product deployability and capital discipline.',
    framework_analysis_zh: '今天的信息适合放在“产品可部署性 × 资本纪律”这个框架下看：技术侧要证明能力能进入真实流程，资本侧要确认这些能力能转化为收入质量、效率提升和估值支撑。',
    forward_summary: 'The next phase of AI may reward companies that combine concrete workflow ownership with measurable economic outcomes.',
    forward_summary_en: 'The next phase of AI may reward companies that combine concrete workflow ownership with measurable economic outcomes.',
    forward_summary_zh: '阶段性看，AI 正在从“能力展示期”进入“结果证明期”。下一轮更有价值的公司，可能是既掌握具体工作流入口，又能把效率、收入或成本改善量化给客户和资本市场看的公司。',
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
  "opening_line": "English opening comment for the Word attachment.",
  "opening_line_en": "A concise English opening comment for the Word attachment.",
  "opening_line_zh": "A 2-3 sentence internet-style Simplified Chinese opening comment for the email body.",
  "daily_summary": "English daily summary for the Word attachment.",
  "daily_summary_en": "A concise English summary for the Word attachment.",
  "daily_summary_zh": "A concise Simplified Chinese summary for the email body.",
  "ai_technology": [
    {
      "topic": "English topic for backward compatibility",
      "topic_en": "English topic",
      "topic_zh": "Simplified Chinese topic",
      "summary": "English summary for backward compatibility",
      "summary_en": "English summary",
      "summary_zh": "Simplified Chinese summary",
      "key_facts": ["English concrete fact or source signal"],
      "key_facts_en": ["English concrete fact or source signal"],
      "key_facts_zh": ["Simplified Chinese concrete fact or source signal"],
      "framework": "English name of the professional analysis framework used",
      "framework_en": "English name of the professional analysis framework used",
      "framework_zh": "Simplified Chinese name of the professional analysis framework used",
      "impact": "English impact for backward compatibility",
      "impact_en": "English impact",
      "impact_zh": "Simplified Chinese impact",
      "analysis": "English professional analysis for backward compatibility",
      "analysis_en": "English professional analysis",
      "analysis_zh": "Simplified Chinese professional analysis from an AI technology expert perspective",
      "forward_view": "English forward-looking view for backward compatibility",
      "forward_view_en": "English forward-looking view",
      "forward_view_zh": "Simplified Chinese forward-looking view on what this means for AI development",
      "source": "...",
      "source_published_at": "ISO-8601 timestamp"
    }
  ],
  "pe_investment": [
    {
      "topic": "English topic for backward compatibility",
      "topic_en": "English topic",
      "topic_zh": "Simplified Chinese topic",
      "amount": "",
      "summary": "English summary for backward compatibility",
      "summary_en": "English summary",
      "summary_zh": "Simplified Chinese summary",
      "key_facts": ["English concrete fact or source signal"],
      "key_facts_en": ["English concrete fact or source signal"],
      "key_facts_zh": ["Simplified Chinese concrete fact or source signal"],
      "framework": "English name of the professional analysis framework used",
      "framework_en": "English name of the professional analysis framework used",
      "framework_zh": "Simplified Chinese name of the professional analysis framework used",
      "impact": "English impact for backward compatibility",
      "impact_en": "English impact",
      "impact_zh": "Simplified Chinese impact",
      "analysis": "English professional analysis for backward compatibility",
      "analysis_en": "English professional analysis",
      "analysis_zh": "Simplified Chinese professional analysis from a PE/investment expert perspective",
      "forward_view": "English forward-looking view for backward compatibility",
      "forward_view_en": "English forward-looking view",
      "forward_view_zh": "Simplified Chinese forward-looking view on what this means for AI development and investment",
      "source": "...",
      "source_published_at": "ISO-8601 timestamp"
    }
  ],
  "framework_analysis": "English stage-level framework analysis for backward compatibility",
  "framework_analysis_en": "English stage-level framework analysis",
  "framework_analysis_zh": "Simplified Chinese stage-level framework analysis that connects today's concrete cases",
  "forward_summary": "English forward-looking synthesis for backward compatibility",
  "forward_summary_en": "English forward-looking synthesis",
  "forward_summary_zh": "Simplified Chinese forward-looking synthesis"
}

Rules:
- Use English for opening_line, opening_line_en, daily_summary, daily_summary_en, topic, topic_en, summary, summary_en, impact, and impact_en.
- Use English for key_facts, key_facts_en, framework, framework_en, analysis, analysis_en, forward_view, forward_view_en, framework_analysis, framework_analysis_en, forward_summary, and forward_summary_en.
- Use Simplified Chinese for opening_line_zh, daily_summary_zh, topic_zh, summary_zh, key_facts_zh, framework_zh, impact_zh, analysis_zh, forward_view_zh, framework_analysis_zh, and forward_summary_zh.
- opening_line_zh must be based on today's selected news, written as 2-3 concise internet-style sentences: lively, specific, slightly witty, and information-dense, but not clickbait and not childish. It must not reuse generic templates such as "技术在赶路，资本在看路牌".
- daily_summary_zh and daily_summary_en must summarize today's actual information signals, not explain the report rules. They should mention both AI technology and PE/investment angles when data is available, and must be specific to today's selected items.
- key_facts_zh must preserve concrete facts from the provided source item. Include company/product/deal names, disclosed numbers, product features, customer/deployment details, policy actions, market signals, or other specific information if present. If the source lacks numbers, do not invent them; preserve the concrete non-numeric signal instead.
- framework_zh must name the analysis lens being applied, such as 产品分析框架, 技术栈分析框架, 平台生态分析框架, 监管/治理框架, 投行/PE 分析框架, or 资本市场定价框架.
- analysis_zh must explain the professional significance of the item. For AI technology, write from the perspective of AI product/platform/infrastructure development. For PE/investment, write from the perspective of valuation, deployment, market structure, and capital allocation.
- forward_view_zh must explain the forward-looking meaning for AI development in 1-2 concrete sentences. Avoid empty conclusions; connect the item to capability trajectory, adoption curve, regulation, infrastructure demand, competition, or investment logic.
- summary_zh should state what happened; analysis_zh should explain why it matters; forward_view_zh should explain what it may imply next.
- framework_analysis_zh must synthesize today's concrete cases into a stage-level framework, not repeat item summaries.
- forward_summary_zh must provide a concise forward-looking conclusion about the current phase of AI development and investment, grounded in today's selected items.
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
