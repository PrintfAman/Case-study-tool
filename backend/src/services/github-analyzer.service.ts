import { z } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

export interface GitHubAnalysis {
  owner: string;
  repository: string;
  url: string;
  metadata: Record<string, unknown>;
  languages: Record<string, number>;
  structure: string[];
  dependencies: string[];
  detectedTechnology: string[];
  assessment: string[];
  analyzedAt: string;
}

const repoSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  html_url: z.string(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  default_branch: z.string(),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  license: z.object({ spdx_id: z.string().nullable() }).nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  size: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
});

export function parseGitHubUrl(rawUrl: string): { owner: string; repository: string } {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new AppError('Invalid GitHub repository URL', { statusCode: 400, code: 'BAD_REQUEST' }); }
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
    throw new AppError('Only https://github.com/owner/repository URLs are supported', { statusCode: 400, code: 'BAD_REQUEST' });
  }
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 2) throw new AppError('GitHub URL must identify one owner and repository', { statusCode: 400, code: 'BAD_REQUEST' });
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?$/.test(segments[0]) || !/^[-._A-Za-z0-9]+$/.test(segments[1])) {
    throw new AppError('GitHub owner or repository name is invalid', { statusCode: 400, code: 'BAD_REQUEST' });
  }
  return { owner: segments[0], repository: segments[1].replace(/\.git$/, '') };
}

async function githubFetch(path: string): Promise<Response> {
  const response = await fetch(`https://api.github.com${path}`, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Case-Study-Tool',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (response.status === 404) throw new AppError('GitHub repository was not found or is private', { statusCode: 404, code: 'NOT_FOUND' });
  if (response.status === 403) throw new AppError('GitHub API rate limit or access restriction reached', { statusCode: 429, code: 'RATE_LIMITED' });
  if (!response.ok) throw new AppError(`GitHub API returned HTTP ${response.status}`, { statusCode: 502, code: 'BAD_REQUEST' });
  return response;
}

export async function analyzeGitHubRepository(rawUrl: string): Promise<GitHubAnalysis> {
  const { owner, repository } = parseGitHubUrl(rawUrl);
  const repoResponse = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`);
  const repo = repoSchema.parse(await repoResponse.json());
  const encodedRef = encodeURIComponent(repo.default_branch);

  const languagesResponse = await githubFetch(`/repos/${owner}/${repository}/languages`);
  const languages = await languagesResponse.json() as Record<string, number>;

  const treeResponse = await githubFetch(`/repos/${owner}/${repository}/git/trees/${encodedRef}?recursive=1`);
  const treePayload = await treeResponse.json() as { truncated?: boolean; tree?: Array<{ path: string; type: string }> };
  const paths = (treePayload.tree ?? []).filter((item) => item.type === 'blob').map((item) => item.path).slice(0, 300);

  const dependencyFiles = paths.filter((path) => /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|Cargo\.toml|go\.mod|pom\.xml|Gemfile|composer\.json|pubspec\.yaml)$/i.test(path)).slice(0, 20);
  const dependencies = new Set<string>();
  const detectedTechnology = new Set<string>();

  for (const path of dependencyFiles) {
    try {
      const response = await githubFetch(`/repos/${owner}/${repository}/contents/${encodeURIComponent(path)}?ref=${encodedRef}`);
      const payload = await response.json() as { content?: string; encoding?: string };
      if (!payload.content || payload.encoding !== 'base64') continue;
      const content = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8').slice(0, 100_000);

      if (/(express|fastify|nestjs|koa)/i.test(content)) detectedTechnology.add('Node.js API framework');
      if (/(react|next|vue|angular|svelte)/i.test(content)) detectedTechnology.add('Frontend framework');
      if (/(prisma|typeorm|mongoose|sequelize|postgres|mysql|sqlite)/i.test(content)) detectedTechnology.add('Database/ORM');
      if (/(tailwind|bootstrap|styled-components)/i.test(content)) detectedTechnology.add('CSS framework');

      for (const match of content.matchAll(/["']([@a-zA-Z0-9][@a-zA-Z0-9._/-]*)["']\s*[:=]/g)) {
        const name = match[1];
        if (name && !name.startsWith('.') && name.length < 80) dependencies.add(name);
      }
    } catch {
      // One inaccessible manifest must not invalidate the entire repository analysis.
    }
  }

  const assessment: string[] = [];
  if (paths.length > 250) assessment.push('Repository has a large source tree; architecture should be reviewed in modules.');
  if (paths.some((path) => /(^|\/)(test|tests|__tests__)(\/|$)/i.test(path))) assessment.push('Automated test directories or files were detected.');
  else assessment.push('No conventional test directory was detected in the inspected tree.');
  if (!paths.some((path) => /(^|\/)(readme\.md|readme\.txt)$/i.test(path))) assessment.push('No README file was detected.');
  if (dependencyFiles.length === 0) assessment.push('No common dependency manifest was found in the inspected tree.');

  return {
    owner,
    repository,
    url: repo.html_url,
    metadata: {
      description: repo.description,
      homepage: repo.homepage,
      defaultBranch: repo.default_branch,
      primaryLanguage: repo.language,
      topics: repo.topics,
      license: repo.license?.spdx_id ?? null,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      sizeKb: repo.size,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
    },
    languages,
    structure: paths.slice(0, 250),
    dependencies: [...dependencies].slice(0, 100),
    detectedTechnology: [...detectedTechnology],
    assessment,
    analyzedAt: new Date().toISOString(),
  };
}
