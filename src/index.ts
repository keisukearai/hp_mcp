#!/usr/bin/env node
/**
 * hp-mcp — a sample MCP server.
 *
 * Exposes the kotoragk HP (homepage) public API as read-only MCP tools.
 * It is a thin HTTP client: each tool fetches an endpoint under
 * `${HP_API_BASE_URL}/hp/...` and returns the JSON to the model.
 *
 * Transport: stdio (for local use from Claude Code and other MCP clients).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Base URL of the HP API. Defaults to the public production site; override with
// e.g. HP_API_BASE_URL=http://127.0.0.1:8000 to point at a local Django server.
const BASE_URL = (process.env.HP_API_BASE_URL ?? "https://kotoragk.com").replace(/\/+$/, "");

/** Fetch a path under /hp and return the parsed JSON, or throw a readable error. */
async function fetchHp(path: string): Promise<unknown> {
  const url = `${BASE_URL}/hp${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

/** Wrap a value as an MCP text-content result (pretty-printed JSON). */
function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

/** Wrap an error as an MCP error result. */
function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

const server = new McpServer({
  name: "hp-mcp",
  version: "0.1.0",
});

server.registerTool(
  "get_news",
  {
    title: "Get HP news list",
    description:
      "Fetch the news (お知らせ) list from the HP. Returns news items, total count and categories.",
    inputSchema: {
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("1-based page number for pagination (optional)."),
    },
  },
  async ({ page }) => {
    try {
      const query = page ? `?page=${page}` : "";
      return jsonResult(await fetchHp(`/news${query}`));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "get_news_detail",
  {
    title: "Get HP news detail",
    description:
      "Fetch a single news article by its number, including previous/next links.",
    inputSchema: {
      newsnumber: z
        .number()
        .int()
        .positive()
        .describe("The news number (id) to fetch."),
    },
  },
  async ({ newsnumber }) => {
    try {
      return jsonResult(await fetchHp(`/news/${newsnumber}/`));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "get_company",
  {
    title: "Get HP company info",
    description: "Fetch the company (会社情報) profile from the HP.",
    inputSchema: {},
  },
  async () => {
    try {
      return jsonResult(await fetchHp(`/company`));
    } catch (err) {
      return errorResult(err);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so it does not corrupt the stdio JSON-RPC stream on stdout.
  console.error(`hp-mcp running on stdio (HP_API_BASE_URL=${BASE_URL})`);
}

main().catch((err) => {
  console.error("Fatal error starting hp-mcp:", err);
  process.exit(1);
});
