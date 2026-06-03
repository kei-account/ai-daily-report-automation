# AI 每日报告自动化

[English README](README.md)

这是一个面向 Codex 的 AI 每日报告自动化模板，用于每天生成 AI 行业情报简报、Word 报告附件，以及结构化中文邮件正文。

项目适合这些场景：

- 每天追踪硅谷 AI 热点
- 每天整理华尔街 / PE 对 AI 的投资动态
- 自动生成中文高管简报
- 自动生成 `.docx` 报告附件
- 通过 Codex 的 Gmail 工具发送或创建邮件草稿

这个仓库是公开模板，不包含私人邮箱、真实凭据、已生成报告或 Gmail token。

## 生成内容

运行后会生成：

- `outputs/AI_Daily_Report_YYYY-MM-DD.docx`
- `email_body.txt`

邮件正文为简体中文，默认结构包括：

- 对收件人的简短称呼
- 一句简练、轻松的小总结
- 今日核心摘要
- 硅谷 AI 热点
- 华尔街 / PE 投资动态
- 综合判断
- 来源链接

## 快速开始

安装依赖：

```bash
npm install
```

运行示例数据：

```bash
npm run check
```

使用自己的 `research_data.json` 生成报告：

```bash
npm run generate
```

## 输入数据格式

在项目根目录创建 `research_data.json`：

```json
{
  "date": "YYYY-MM-DD",
  "silicon_valley": [
    {
      "topic": "主题标题",
      "summary": "简短事实摘要。",
      "source": "https://example.com"
    }
  ],
  "wall_street_pe": [
    {
      "topic": "主题标题",
      "amount": "$100M",
      "summary": "简短事实摘要。",
      "source": "https://example.com"
    }
  ]
}
```

示例文件见：[examples/research_data.example.json](examples/research_data.example.json)

## Codex 自动化

每日自动化提示词在这里：

[docs/codex_automation_prompt.md](docs/codex_automation_prompt.md)

推荐运行时间：

```text
每天早上 09:00，使用你的本地时区
```

自动化任务应该执行：

- 每天重新进行 Web 搜索
- 使用最新可靠来源
- 避免复用旧测试数据
- 生成 Word 报告
- 生成中文结构化邮件正文
- 如果 Gmail 工具可用，直接发送邮件
- 如果不能直接发送，则创建 Gmail 草稿

## Gmail 说明

这个 Node.js 项目本身不直接连接 Gmail。

在 Codex 工作流里，Gmail 发送由 Gmail connector / plugin 完成。你可以在自动化提示词里配置收件人，也可以用环境变量保存配置，例如：

```bash
REPORT_RECIPIENT=your-email@example.com
```

公开仓库中不要提交：

- 私人邮箱
- API key
- OAuth token
- 已生成的真实报告
- 邮件正文成品

## DOCX 说明

报告使用 `docx` 包生成。

页码使用：

```js
new SimpleField('PAGE')
```

不要使用 `PageNumber`，因为它在某些 `docx` 版本中可能不可用或行为不稳定。

## 目录结构

```text
.
├── docs/
│   └── codex_automation_prompt.md
├── examples/
│   └── research_data.example.json
├── src/
│   ├── create_report.js
│   ├── generate_email.js
│   └── run.js
├── .env.example
├── package.json
├── README.md
└── README.zh-CN.md
```

## 常见工作流

1. Codex 每天搜索最新 AI 信息。
2. Codex 整理为 `research_data.json`。
3. 脚本生成 Word 报告。
4. 脚本生成中文邮件正文。
5. Codex 调用 Gmail 工具发送邮件或保存草稿。

## 许可证

MIT
