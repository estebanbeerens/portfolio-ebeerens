import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { McpToolsService } from './mcp-tools.service';

@ApiExcludeController()
@Controller('mcp')
export class McpController {
  constructor(private readonly tools: McpToolsService) {}

  @All()
  async handle(@Req() request: Request, @Res() response: Response): Promise<void> {
    const baseUrl = process.env.MCP_PUBLIC_URL ?? 'http://localhost:3000';
    const mcpUrl = new URL(baseUrl);
    const hostname = mcpUrl.hostname;
    const server = new McpServer({ name: 'ebeerens-portfolio', version: '1.0.0' });
    this.tools.register(server);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      allowedHosts: [mcpUrl.host, hostname, 'localhost', '127.0.0.1'],
      enableDnsRebindingProtection: true,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } finally {
      await server.close();
    }
  }
}
