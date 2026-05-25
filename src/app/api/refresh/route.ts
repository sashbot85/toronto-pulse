import { NextResponse } from 'next/server';
import fs from 'node:fs';
import {
  generatePulseData,
  getPulseDataOutputPath,
  getPulseHistoryOutputPath,
  writePulseDataFile,
} from '@/lib/pulse-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

let lastRefreshStartedAt = 0;
const MIN_REFRESH_GAP_MS = 10 * 60 * 1000;

function toBase64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

async function getGitHubFileSha(owner: string, repo: string, path: string, token: string, branch: string): Promise<string | undefined> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  });

  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`GitHub SHA lookup failed for ${path}: ${response.status}`);

  const payload = await response.json() as { sha?: string };
  return payload.sha;
}

async function putGitHubFile(owner: string, repo: string, path: string, content: string, token: string, branch: string, message: string) {
  const sha = await getGitHubFileSha(owner, repo, path, token, branch);

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      branch,
      sha,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub update failed for ${path}: ${response.status} ${text}`);
  }
}

type GitHubSyncResult =
  | { synced: true; owner: string; repo: string; branch: string }
  | { synced: false; reason: string };

async function syncSnapshotToGitHub(dataPath: string, historyPath: string): Promise<GitHubSyncResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { synced: false, reason: 'missing GITHUB_TOKEN' };
  }

  const owner = process.env.GITHUB_REPO_OWNER || 'sashbot85';
  const repo = process.env.GITHUB_REPO_NAME || 'toronto-pulse';
  const branch = process.env.GITHUB_REPO_BRANCH || 'main';
  const commitMessage = `data: pulse update ${new Date().toISOString()}`;

  const dataContent = fs.readFileSync(dataPath, 'utf8');
  const historyContent = fs.readFileSync(historyPath, 'utf8');

  await putGitHubFile(owner, repo, 'public/data/pulse-data.json', dataContent, token, branch, commitMessage);
  await putGitHubFile(owner, repo, 'public/data/pulse-history.json', historyContent, token, branch, commitMessage);

  return { synced: true, owner, repo, branch };
}

export async function POST() {
  const now = Date.now();

  if (lastRefreshStartedAt && now - lastRefreshStartedAt < MIN_REFRESH_GAP_MS) {
    const waitSeconds = Math.ceil((MIN_REFRESH_GAP_MS - (now - lastRefreshStartedAt)) / 1000);
    return NextResponse.json(
      {
        error: 'Refresh is cooling down.',
        retryAfterSeconds: waitSeconds,
      },
      { status: 429 }
    );
  }

  lastRefreshStartedAt = now;

  try {
    const data = await generatePulseData();
    const dataPath = getPulseDataOutputPath();
    const historyPath = getPulseHistoryOutputPath();

    writePulseDataFile(data, dataPath);

    let githubSync: GitHubSyncResult | null = null;
    try {
      githubSync = await syncSnapshotToGitHub(dataPath, historyPath);
    } catch (githubError) {
      console.error('[TorontoPulse] GitHub sync failed:', githubError);
      githubSync = { synced: false, reason: String(githubError) };
    }

    return NextResponse.json(
      {
        ...data,
        persisted: {
          localFiles: true,
          github: githubSync,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[TorontoPulse] Manual refresh failed:', error);
    return NextResponse.json(
      { error: 'Manual refresh failed.' },
      { status: 500 }
    );
  }
}
