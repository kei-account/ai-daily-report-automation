const fs = require('fs');

const MISSING_EN = 'Not disclosed by the provided source; requires further verification.';
const MISSING_ZH = '来源未披露，需进一步核验。';

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Model response did not contain JSON.');
  }
  return JSON.parse(match[0]);
}

function inferEntityName(item) {
  const title = item.title || '';
  const match = title.match(/^([^:：|｜\-—–]+?)(?:[:：|｜\-—–]|\s+raises|\s+secures|\s+announces|\s+launches|\s+warns|\s+urges|\s+backs|\s+buys|\s+acquires)/i);
  return (match?.[1] || title.split(/\s+/).slice(0, 4).join(' ') || 'Unknown subject').trim();
}

function enrichFallbackItem(item, category) {
  const topic = item.title || 'Untitled AI news item';
  const summary = item.summary || topic;
  const entityName = inferEntityName(item);
  const isInvestment = category === 'investment';
  const frameworkEn = isInvestment
    ? 'PE analysis: subject, action, deal signal, market structure, revenue model, moat, valuation driver, and downside risk.'
    : 'AI technology analysis: subject, action, product or technical role, workflow impact, defensibility, adoption friction, and risk.';
  const frameworkZh = isInvestment
    ? '投行/PE 分析框架：主体、行动、交易信号、市场结构、收入模式、护城河、估值驱动与下行风险。'
    : 'AI 技术/产品分析框架：主体、行动、产品或技术角色、工作流影响、壁垒、采用阻力与风险。';
  const analysisEn = isInvestment
    ? 'Read this as a concrete capital-allocation signal first, then as a broader indicator of where investors believe AI can produce measurable workflow efficiency, revenue quality, or valuation support.'
    : 'Read this as a concrete company or product action first, then as a signal about whether AI capabilities are moving into repeatable product, platform, infrastructure, governance, or enterprise workflow patterns.';
  const analysisZh = isInvestment
    ? '这条信息应先作为具体资本配置动作来读：谁获得资金、谁参与、资金指向哪个工作流或市场。进一步看，它反映投资人正在寻找能够产生可量化效率、收入质量或估值支撑的 AI 场景。'
    : '这条信息应先作为具体主体的具体行动来读：谁发布、调整、融资、合作或被监管影响。进一步看，它反映 AI 能力是否正在进入可重复的产品、平台、基础设施、治理或企业工作流。';

  return {
    topic,
    topic_en: topic,
    topic_zh: topic,
    entity_name: entityName,
    entity_name_en: entityName,
    entity_name_zh: entityName,
    entity_type: isInvestment ? 'Company or investment subject' : 'AI company, product, model, or policy actor',
    entity_type_en: isInvestment ? 'Company or investment subject' : 'AI company, product, model, or policy actor',
    entity_type_zh: isInvestment ? '公司或投资主体' : 'AI 公司、产品、模型或政策主体',
    action: summary,
    action_en: summary,
    action_zh: summary,
    entity_profile: MISSING_EN,
    entity_profile_en: MISSING_EN,
    entity_profile_zh: MISSING_ZH,
    leadership_background: MISSING_EN,
    leadership_background_en: MISSING_EN,
    leadership_background_zh: MISSING_ZH,
    product_or_business: MISSING_EN,
    product_or_business_en: MISSING_EN,
    product_or_business_zh: MISSING_ZH,
    deal_or_product_details: summary,
    deal_or_product_details_en: summary,
    deal_or_product_details_zh: summary,
    source_limitations: 'Fallback mode uses only the RSS title, summary, URL, and timestamp.',
    source_limitations_en: 'Fallback mode uses only the RSS title, summary, URL, and timestamp.',
    source_limitations_zh: '当前为备用模式，仅使用 RSS 标题、摘要、链接与时间戳；未披露信息不会补写。',
    summary,
    summary_en: summary,
    summary_zh: summary,
    key_facts: [topic, summary].filter(Boolean).slice(0, 2),
    key_facts_en: [topic, summary].filter(Boolean).slice(0, 2),
    key_facts_zh: [topic, summary].filter(Boolean).slice(0, 2),
    framework: frameworkEn,
    framework_en: frameworkEn,
    framework_zh: frameworkZh,
    impact: isInvestment
      ? 'Needs monitoring for capital allocation, enterprise AI deployment, and valuation implications.'
      : 'Needs monitoring for AI product strategy, platform direction, infrastructure demand, or governance implications.',
    impact_en: isInvestment
      ? 'Needs monitoring for capital allocation, enterprise AI deployment, and valuation implications.'
      : 'Needs monitoring for AI product strategy, platform direction, infrastructure demand, or governance implications.',
    impact_zh: isInvestment
      ? '需继续观察其对资本配置、企业 AI 部署和估值逻辑的影响。'
      : '需继续观察其对 AI 产品策略、平台方向、基础设施需求或治理逻辑的影响。',
    analysis: analysisEn,
    analysis_en: analysisEn,
    analysis_zh: analysisZh,
    forward_view: isInvestment
      ? 'If similar signals continue, AI investment may concentrate around companies with concrete workflow ownership, proprietary data, and measurable ROI.'
      : 'If similar signals continue, AI competition may shift further toward workflow ownership, reliability, governance, and deployment depth.',
    forward_view_en: isInvestment
      ? 'If similar signals continue, AI investment may concentrate around companies with concrete workflow ownership, proprietary data, and measurable ROI.'
      : 'If similar signals continue, AI competition may shift further toward workflow ownership, reliability, governance, and deployment depth.',
    forward_view_zh: isInvestment
      ? '如果类似信号持续出现，AI 投资会更集中流向拥有具体工作流入口、专有数据和可衡量 ROI 的公司。资本会更挑剔，但也更愿意为确定性付溢价。'
      : '如果类似信号持续出现，AI 竞争会进一步转向工作流入口、可靠性、治理能力和部署深度。单纯模型能力会越来越需要被具体场景验证。',
    source: item.link,
    source_published_at: item.published_at
  };
}

function fallbackResearch(newsBundle) {
  const items = newsBundle.items || [];
  const firstTitle = items[0]?.title || 'AI 新闻不算少';
  const secondTitle = items[1]?.title || '资本市场也没闲着';
  const aiTechnology = items.slice(0, 3).map(item => enrichFallbackItem(item, 'technology'));
  const peInvestment = items.slice(3, 6).map(item => ({
    ...enrichFallbackItem(item, 'investment'),
    amount: ''
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
      "entity_name": "English subject/entity name for backward compatibility",
      "entity_name_en": "English subject/entity name",
      "entity_name_zh": "Simplified Chinese subject/entity name",
      "entity_type": "English entity type for backward compatibility",
      "entity_type_en": "English entity type",
      "entity_type_zh": "Simplified Chinese entity type",
      "action": "English concrete action for backward compatibility",
      "action_en": "English concrete action",
      "action_zh": "Simplified Chinese concrete action",
      "entity_profile": "English explanation of what the entity does for backward compatibility",
      "entity_profile_en": "English explanation of what the entity does",
      "entity_profile_zh": "Simplified Chinese explanation of what the entity does",
      "leadership_background": "English founder/CEO/key-person background for backward compatibility",
      "leadership_background_en": "English founder/CEO/key-person background",
      "leadership_background_zh": "Simplified Chinese founder/CEO/key-person background",
      "product_or_business": "English product, technology, or business model for backward compatibility",
      "product_or_business_en": "English product, technology, or business model",
      "product_or_business_zh": "Simplified Chinese product, technology, or business model",
      "deal_or_product_details": "English deal/product details for backward compatibility",
      "deal_or_product_details_en": "English deal/product details",
      "deal_or_product_details_zh": "Simplified Chinese deal/product details",
      "source_limitations": "English source limitations for backward compatibility",
      "source_limitations_en": "English source limitations",
      "source_limitations_zh": "Simplified Chinese source limitations",
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
      "entity_name": "English subject/entity name for backward compatibility",
      "entity_name_en": "English subject/entity name",
      "entity_name_zh": "Simplified Chinese subject/entity name",
      "entity_type": "English entity type for backward compatibility",
      "entity_type_en": "English entity type",
      "entity_type_zh": "Simplified Chinese entity type",
      "action": "English concrete action for backward compatibility",
      "action_en": "English concrete action",
      "action_zh": "Simplified Chinese concrete action",
      "entity_profile": "English explanation of what the entity does for backward compatibility",
      "entity_profile_en": "English explanation of what the entity does",
      "entity_profile_zh": "Simplified Chinese explanation of what the entity does",
      "leadership_background": "English founder/CEO/key-person background for backward compatibility",
      "leadership_background_en": "English founder/CEO/key-person background",
      "leadership_background_zh": "Simplified Chinese founder/CEO/key-person background",
      "product_or_business": "English product, technology, or business model for backward compatibility",
      "product_or_business_en": "English product, technology, or business model",
      "product_or_business_zh": "Simplified Chinese product, technology, or business model",
      "deal_or_product_details": "English deal/product details for backward compatibility",
      "deal_or_product_details_en": "English deal/product details",
      "deal_or_product_details_zh": "Simplified Chinese deal/product details",
      "source_limitations": "English source limitations for backward compatibility",
      "source_limitations_en": "English source limitations",
      "source_limitations_zh": "Simplified Chinese source limitations",
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
- Use English for opening_line, opening_line_en, daily_summary, daily_summary_en, topic, topic_en, entity_name, entity_name_en, entity_type, entity_type_en, action, action_en, entity_profile, entity_profile_en, leadership_background, leadership_background_en, product_or_business, product_or_business_en, deal_or_product_details, deal_or_product_details_en, source_limitations, source_limitations_en, summary, summary_en, impact, and impact_en.
- Use English for key_facts, key_facts_en, framework, framework_en, analysis, analysis_en, forward_view, forward_view_en, framework_analysis, framework_analysis_en, forward_summary, and forward_summary_en.
- Use Simplified Chinese for opening_line_zh, daily_summary_zh, topic_zh, entity_name_zh, entity_type_zh, action_zh, entity_profile_zh, leadership_background_zh, product_or_business_zh, deal_or_product_details_zh, source_limitations_zh, summary_zh, key_facts_zh, framework_zh, impact_zh, analysis_zh, forward_view_zh, framework_analysis_zh, and forward_summary_zh.
- opening_line_zh must be based on today's selected news, written as 2-3 concise internet-style sentences: lively, specific, slightly witty, and information-dense, but not clickbait and not childish. It must not reuse generic templates such as "技术在赶路，资本在看路牌".
- daily_summary_zh and daily_summary_en must summarize today's actual information signals, not explain the report rules. They should mention both AI technology and PE/investment angles when data is available, and must be specific to today's selected items.
- Every selected item must start from the concrete news spine: entity_name_zh, action_zh, entity_profile_zh, leadership_background_zh, product_or_business_zh, and deal_or_product_details_zh. These fields are mandatory for every item.
- entity_name_zh must identify the specific company, product, model, person, regulator, investor, or policy actor.
- action_zh must state what that subject did: raised money, launched a product, changed policy, warned regulators, acquired a company, signed a customer, reported earnings, or another concrete action. Do not replace the action with broad commentary.
- entity_profile_zh must explain what the entity does in plain but professional language. For example, identify whether it is a frontier model lab, industrial AI startup, PE workflow platform, AI infrastructure provider, enterprise SaaS company, chip vendor, or regulator.
- leadership_background_zh must include founder/CEO/key-person background only when the provided source text includes it or it is directly inferable from the provided source. If the provided source does not disclose it, write "来源未披露，需进一步核验。" Do not invent biographies.
- product_or_business_zh must explain the product, technology, or business model if available. If unavailable, write "来源未披露，需进一步核验。"
- deal_or_product_details_zh must preserve transaction, product, policy, or deployment details from the source. For PE/investment items, include amount, round, investors, use case, market, or valuation if present. For technology items, include model/product capability, customer, deployment, policy mechanism, or technical feature if present.
- source_limitations_zh must briefly state any factual gaps, such as missing founder background, undisclosed terms, or limited RSS summary depth.
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
