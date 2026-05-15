import { NextResponse } from 'next/server';
import pkg from '../../../package.json';

export function agentSkillsIndex(baseUrl: string) {
  return NextResponse.json(
    {
      $schema: 'https://agentskills.io/schema/v0.2.0/index.json',
      name: 'Forever PTO',
      version: pkg.version,
      description:
        'PTO optimization tool — maximize vacation days by combining PTO with public holidays and bridge days.',
      skills: [
        {
          name: 'markdown-negotiation',
          type: 'skill',
          description: 'Returns page content as Markdown when requested with Accept: text/markdown header.',
          url: `${baseUrl}/.well-known/agent-skills/markdown-negotiation/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          name: 'api-catalog',
          type: 'skill',
          description: 'Publishes an RFC 9727 API catalog at /.well-known/api-catalog.',
          url: `${baseUrl}/.well-known/agent-skills/api-catalog/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          name: 'mcp-server-card',
          type: 'skill',
          description: 'Serves an MCP Server Card (SEP-1649) at /.well-known/mcp/server-card.json.',
          url: `${baseUrl}/.well-known/agent-skills/mcp-server-card/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          name: 'webmcp',
          type: 'skill',
          description: 'Exposes site tools to AI agents via navigator.modelContext.provideContext().',
          url: `${baseUrl}/.well-known/agent-skills/webmcp/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          name: 'calendar-export',
          type: 'feature',
          description:
            'Export vacation plans as a .ics file (importable into Google Calendar, Apple Calendar, Outlook) or as a PDF for printing or sharing.',
          url: `${baseUrl}/.well-known/agent-skills/calendar-export/SKILL.md`,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    },
  );
}
