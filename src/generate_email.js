const fs = require('fs');

function formatAmount(amount) {
  return amount ? `\n   规模：${amount}` : '';
}

function formatSectionItem(item, index) {
  return `${index + 1}. ${item.topic}${formatAmount(item.amount)}
   要点：${item.summary}
   影响：${item.impact || '需继续观察其对产品策略、资本配置和企业采用节奏的影响。'}
   来源：${item.source || '未提供'}`;
}

function generateChineseEmail(researchData, options = {}) {
  const recipientName = options.recipientName || process.env.REPORT_RECIPIENT_NAME || 'yidan';
  const now = options.date ? new Date(options.date) : new Date();
  const todayZh = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const siliconValley = (researchData.silicon_valley || [])
    .map(formatSectionItem)
    .join('\n\n');

  const wallStreet = (researchData.wall_street_pe || [])
    .map(formatSectionItem)
    .join('\n\n');

  return `${recipientName}，早上好。

今天的 AI 圈依旧很忙：模型在努力变成同事，资本在努力判断它们什么时候开始真正打卡赚钱。

以下是 ${todayZh} 的 AI 日报。本期重点关注两条主线：一是硅谷围绕 agentic AI、AGI 和监管合规的讨论；二是华尔街和私募股权资金对 AI 模型、企业部署和基础设施的投资判断。

一、今日核心摘要
1. AI 行业叙事正在从“模型能力展示”转向“可执行任务的 Agent 系统”和企业级部署。
2. AGI 讨论仍缺乏统一定义，但企业客户和投资人更关心 AI 是否能稳定完成复杂工作流。
3. AI 监管正在进入操作层面，合规能力会逐渐影响产品采购、销售周期和公司估值。
4. 投资端热度仍高，但市场开始更重视商业化、利润率、算力成本和执行质量。

二、硅谷 AI 热点
${siliconValley || '暂无足够可靠的新信息。'}

三、华尔街 / PE 投资动态
${wallStreet || '暂无足够可靠的新信息。'}

四、综合判断
短期来看，AI 产业的主要机会不只在模型本身，而在 agentic AI 应用、企业部署服务、算力与端侧基础设施、合规治理工具等可落地环节。对投资人而言，AI 仍是核心主线，但需要更谨慎地区分真实收入、战略入口和估值泡沫。

以上供参考。

AI Daily Report 编辑部`;
}

if (require.main === module) {
  const inputPath = process.argv[2] || 'research_data.json';
  const researchData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  fs.writeFileSync('email_body.txt', generateChineseEmail(researchData));
  console.log('Email body saved: email_body.txt');
}

module.exports = { generateChineseEmail };
