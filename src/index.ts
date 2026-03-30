#!/usr/bin/env node
// src/index.ts — Code Whisperer MCP Server entry point.
// Runs on stdio transport. Add to ~/.claude.json to use in Claude Code:
//
//   "mcpServers": {
//     "code-whisperer": {
//       "command": "npx",
//       "args": ["-y", "@code-whisperer/skills@latest"],
//       "env": { "CODEWHISPERER_API_KEY": "<your-key>" }
//     }
//   }

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import {
  TOOL_DEFINITIONS,
  handleListSkills,
  handleGetSkill,
  handleListTemplates,
  handleGetTemplate,
  handleListPrompts,
  handleGetPrompt,
} from './tools.js'

const server = new Server(
  {
    name: 'code-whisperer-skills',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFINITIONS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params
  const a = args as Record<string, unknown>

  switch (name) {
    case 'list_skills':    return handleListSkills(a)
    case 'get_skill':      return handleGetSkill(a)
    case 'list_templates': return handleListTemplates(a)
    case 'get_template':   return handleGetTemplate(a)
    case 'list_prompts':   return handleListPrompts(a)
    case 'get_prompt':     return handleGetPrompt(a)
    default:
      return {
        content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
        isError: true,
      }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Server running — stdio transport keeps process alive
}

main().catch((err) => {
  console.error('Failed to start Code Whisperer MCP server:', err)
  process.exit(1)
})
