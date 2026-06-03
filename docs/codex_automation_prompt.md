# Codex Automation Prompt

Generate and send today's AI Daily Report in Simplified Chinese.

## Workflow

1. Use web search to gather current-day or latest reliable information for two sections:
   - Silicon Valley AI hot topics: agentic AI, AGI debate, AI safety/regulation, major product/platform shifts.
   - Wall Street / private equity AI investment dynamics: AI funding, PE deals, AI stock outlook, major public-market AI narratives.

2. Organize findings into structured data:
   - `topic`
   - `summary`
   - `amount` if applicable
   - `source`
   - `date`

3. Create a Word report named `AI_Daily_Report_YYYY-MM-DD.docx` in an `outputs` directory.
   - Before generating or editing DOCX code, read the available documents/docx `SKILL.md`.
   - Use `SimpleField('PAGE')` for page numbers.
   - Do not use `PageNumber`.

4. Generate a professional Simplified Chinese email body.
   - Address the recipient as `yidan` at the beginning, or use the configured recipient name.
   - Start with one concise, lightly humorous Chinese summary sentence or short paragraph before the formal report.
   - Keep the humor subtle, elegant, and brief.
   - Then continue with this structure:
     - Opening
     - Today's core summary
     - Silicon Valley AI section
     - Wall Street / PE section
     - Integrated judgment
     - Sign-off as `AI Daily Report 编辑部`
   - Each item should include:
     - 主题
     - 要点
     - 影响
     - 来源
   - The email must be pure text, no Markdown.

5. Send the email with Gmail tooling.
   - Recipient: use the configured recipient email.
   - Subject format: `【AI日报】硅谷与华尔街AI动态速报 — M月D日`
   - Attach the generated DOCX report if attachment support is available.
   - If direct send is unavailable, create a Gmail draft instead and report that it was saved as a draft.

## Requirements

- Use up-to-date sources.
- Include source URLs in both the report and the email body.
- Avoid reusing stale test data.
- Never commit private email addresses, credentials, generated reports, or local connector tokens.
