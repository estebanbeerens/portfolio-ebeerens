import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test } from '@nestjs/testing';
import { ProfileService } from '../profile/profile.service';
import { ProjectsService } from '../projects/projects.service';
import { SkillsService } from '../skills/skills.service';
import { McpToolsService } from './mcp-tools.service';

describe('McpToolsService', () => {
  const profile = {
    id: 'profile-1',
    name: 'Portfolio Owner',
    headline: 'Engineer',
    bio: 'Builds public things.',
    bioHtml: '<p>Builds public things.</p>',
    githubUrl: 'https://github.com/example',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
  const project = {
    id: 'project-1',
    title: 'Public Project',
    slug: 'public-project',
    shortDescription: 'A public summary.',
    description: 'A detailed description.',
    imageUrl: 'https://images.example.com/project.webp',
    imageObjectKey: 'private/internal-key',
    isCvFeatured: true,
    skills: [{ id: 'skill-1', name: 'TypeScript' }],
    startDate: new Date('2025-01-01T00:00:00Z'),
    endDate: null,
  };
  const role = {
    id: 'role-1',
    jobTitle: 'Engineer',
    organization: {
      id: 'organization-1',
      name: 'Public Organization',
      logoUrl: null,
      logoObjectKey: 'private/organization-key',
      website: 'https://organization.example.com',
    },
    description: 'Designed APIs.',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: null,
    skills: [{ id: 'skill-1', name: 'TypeScript' }],
  };
  const education = {
    id: 'education-1',
    degree: 'BSc',
    fieldOfStudy: 'Computer Science',
    institution: {
      id: 'institution-1',
      name: 'Public University',
      logoUrl: null,
      logoObjectKey: 'private/institution-key',
      website: 'https://university.example.com',
    },
    description: 'Studied software engineering.',
    startDate: new Date('2018-01-01T00:00:00Z'),
    endDate: new Date('2021-01-01T00:00:00Z'),
  };

  let service: McpToolsService;
  let server: McpServer;
  let client: Client;
  let projects: { findPublicAll: jest.Mock };
  let skills: { findAll: jest.Mock };

  beforeEach(async () => {
    const profileService = {
      findPublicPortfolio: jest.fn().mockResolvedValue({
        profile,
        roles: [role],
        education: Array.from({ length: 25 }, (_, index) =>
          index === 0 ? education : { ...education, id: `education-${index + 1}` }
        ),
        projects: [project],
        featureFlags: [{ key: 'CONTACT', enabled: false }],
      }),
    };
    projects = { findPublicAll: jest.fn().mockResolvedValue([project]) };
    skills = { findAll: jest.fn().mockResolvedValue([{ id: 'skill-1', name: 'TypeScript' }]) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        McpToolsService,
        { provide: ProfileService, useValue: profileService },
        { provide: ProjectsService, useValue: projects },
        { provide: SkillsService, useValue: skills },
      ],
    }).compile();
    service = moduleRef.get(McpToolsService);
    server = new McpServer({ name: 'test', version: '1.0.0' });
    service.register(server);
    client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it('advertises only the intended read-only portfolio tools and serves their public projections', async () => {
    const { tools } = await client.listTools();
    expect(tools.map(({ name }) => name)).toEqual([
      'get_profile',
      'search_projects',
      'get_project',
      'list_experience',
      'get_experience',
      'list_skills',
      'list_education',
      'search_portfolio',
    ]);

    const result = await client.callTool({ name: 'get_project', arguments: { idOrSlug: 'public-project' } });
    const content = result.content[0];
    expect(content.type).toBe('text');
    const response = JSON.parse(content.type === 'text' ? content.text : '');
    expect(response).toMatchObject({ id: 'project-1', title: 'Public Project' });
    expect(response).not.toHaveProperty('imageObjectKey');
    expect(response).not.toHaveProperty('isCvFeatured');
  });

  it('omits internal organization data and feature flags from MCP results', async () => {
    const result = await client.callTool({ name: 'list_experience', arguments: {} });
    const response = JSON.parse(result.content[0].type === 'text' ? result.content[0].text : '');
    expect(response[0].organization).toEqual({
      id: 'organization-1',
      name: 'Public Organization',
      website: 'https://organization.example.com',
    });
    expect(response[0].organization).not.toHaveProperty('logoObjectKey');
    expect(JSON.stringify(response)).not.toContain('featureFlags');
  });

  it('rejects invalid search input through the MCP tool schema', async () => {
    const result = await client.callTool({ name: 'search_projects', arguments: { query: '' } });
    expect(result.isError).toBe(true);
    expect(projects.findPublicAll).not.toHaveBeenCalled();
  });

  it('caps list and search responses at the supported maximum', async () => {
    const result = await client.callTool({
      name: 'search_projects',
      arguments: { query: 'public', limit: 500 },
    });
    expect(result.isError).toBe(true);
    expect(projects.findPublicAll).not.toHaveBeenCalled();

    await expect(service.listEducation('en', 500)).resolves.toHaveLength(20);
  });

  it('returns only a bounded public education projection', async () => {
    const result = await client.callTool({ name: 'list_education', arguments: {} });
    const response = JSON.parse(result.content[0].type === 'text' ? result.content[0].text : '');
    expect(response[0]).toMatchObject({ id: 'education-1', degree: 'BSc' });
    expect(response[0].institution).not.toHaveProperty('logoObjectKey');
    expect(response).toHaveLength(10);
  });
});
