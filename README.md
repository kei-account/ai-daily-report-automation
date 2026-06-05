# AI Daily Report Automation

[中文说明](README.zh-CN.md)

A Codex-ready workflow for generating a daily AI intelligence report:

1. Search current AI news and investment signals.
2. Save structured research data as JSON.
3. Generate a Word report (`.docx`).
4. Generate a structured Simplified Chinese email brief.
5. Use Gmail tooling in Codex to send or draft the email.

The project is designed as a public template. It does not include private email addresses, generated reports, or live credentials.

## What It Produces

- `outputs/AI_Daily_Report_YYYY-MM-DD.docx`
- `email_body.txt`
- A Gmail-ready Chinese email body with:
  - A short greeting to `yidan` or your configured recipient name
  - A concise, lightly humorous executive summary
  - Core takeaways
  - Silicon Valley AI topics
  - Wall Street / PE AI investment dynamics
  - Integrated judgment
  - Source URLs

## Quick Start

Install dependencies:

```bash
npm install
```

Run the example:

```bash
npm run check
```

Run with your own `research_data.json`:

```bash
npm run generate
```

## Input Format

Create `research_data.json` in the project root:

```json
{
  "date": "YYYY-MM-DD",
  "silicon_valley": [
    {
      "topic": "Topic title",
      "summary": "Brief factual summary.",
      "source": "https://example.com"
    }
  ],
  "wall_street_pe": [
    {
      "topic": "Topic title",
      "amount": "$100M",
      "summary": "Brief factual summary.",
      "source": "https://example.com"
    }
  ]
}
```

See [examples/research_data.example.json](examples/research_data.example.json).

## Codex Automation

Use [docs/codex_automation_prompt.md](docs/codex_automation_prompt.md) as the daily automation prompt.

Recommended schedule:

```text
Every day at 09:00 in your local timezone
```

The automation should:

- Gather fresh web search results each day.
- Avoid stale test data.
- Generate the DOCX report.
- Generate the Chinese email body.
- Send the email via Gmail if available.
- Fall back to creating a Gmail draft if direct send is unavailable.

## GitHub Actions Automation

For reliable unattended delivery, use the included GitHub Actions workflow:

```text
.github/workflows/daily-report.yml
```

It runs every day at `09:00 JST` and can also be triggered manually from the GitHub Actions tab.

Required GitHub Secrets:

```text
OPENAI_API_KEY
GMAIL_USER
GMAIL_APP_PASSWORD
REPORT_RECIPIENT
```

Optional GitHub Secrets:

```text
OPENAI_MODEL
REPORT_RECIPIENT_NAME
```

To change the report style, edit:

```text
config/report_requirements.md
```

To change source topics and RSS feeds, edit:

```text
config/topics.json
```

Run the same pipeline locally:

```bash
npm run daily
```

## Gmail Notes

This repository does not send Gmail directly from Node.js. In the Codex workflow, Gmail is handled by the Gmail connector/plugin.

For public reuse, configure your recipient through the automation prompt or an environment variable such as:

```bash
REPORT_RECIPIENT=your-email@example.com
```

## DOCX Notes

The report uses the `docx` package. Page numbers use:

```js
new SimpleField('PAGE')
```

Do not use `PageNumber`, which can fail depending on the `docx` package version.

## License

MIT
