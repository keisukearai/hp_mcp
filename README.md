# @kotoragk/hp-mcp

A **sample MCP (Model Context Protocol) server** that exposes the kotoragk HP
(homepage) public API as read-only tools. It is intentionally small: a thin HTTP
client that fetches the existing HP endpoints and returns the JSON to the model.

Use it as a reference for how to build and publish an MCP server in TypeScript.

## Tools

| Tool | Arguments | Description |
|------|-----------|-------------|
| `get_news` | `page?` (number) | News (お知らせ) list with count and categories |
| `get_news_detail` | `newsnumber` (number) | A single news article, with prev/next links |
| `get_company` | — | Company (会社情報) profile |

Each tool calls `${HP_API_BASE_URL}/hp/...` and returns the raw JSON.

## Install into Claude Code

```bash
claude mcp add hp -- npx -y @kotoragk/hp-mcp
```

To point at a different backend (e.g. a local Django server), pass the env var:

```bash
claude mcp add hp -e HP_API_BASE_URL=http://127.0.0.1:8000 -- npx -y @kotoragk/hp-mcp
```

| Env var | Default | Description |
|---------|---------|-------------|
| `HP_API_BASE_URL` | `https://kotoragk.com` | Base URL of the HP API (no trailing `/hp`) |

## Local development

```bash
npm install
npm run build      # compiles src/ -> dist/
npm start          # runs dist/index.js on stdio
```

The server speaks the MCP protocol over **stdio**, so running it directly just
waits for a client. Use an MCP client (Claude Code, the MCP Inspector, etc.) to
interact with it.

## Publish

```bash
npm login
npm publish --access public
```
