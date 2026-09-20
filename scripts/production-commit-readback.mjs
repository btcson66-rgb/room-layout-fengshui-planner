import fs from 'node:fs/promises';
import path from 'node:path';

const repository = process.env.GITHUB_REPOSITORY ?? 'btcson66-rgb/room-layout-fengshui-planner';
const server = (process.env.GITHUB_SERVER_URL ?? 'https://github.com').replace(/\/$/, '');
const apiBase = (process.env.GITHUB_API_URL ?? (server === 'https://github.com' ? 'https://api.github.com' : `${server}/api/v3`)).replace(/\/$/, '');
const expectedSha = process.env.GITHUB_SHA ?? '';
const runId = process.env.GITHUB_RUN_ID ?? '';
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? '';
const outputPath = path.resolve(process.env.ROOMFENG_COMMIT_READBACK_PATH ?? 'release-evidence/commit-readback.json');

if (!expectedSha || !runId || !token) throw new Error('GITHUB_SHA, GITHUB_RUN_ID, and GH_TOKEN are required for commit readback');

async function githubJson(endpoint, accept = 'application/vnd.github+json') {
  const response = await fetch(`${apiBase}${endpoint}`, {
    headers: {
      accept,
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`GitHub API ${endpoint} returned ${response.status}: ${body.slice(0, 240)}`);
  return JSON.parse(body);
}

const [mainCommit, workflowRun, relatedPulls] = await Promise.all([
  githubJson(`/repos/${repository}/commits/main`),
  githubJson(`/repos/${repository}/actions/runs/${runId}`),
  githubJson(`/repos/${repository}/commits/${expectedSha}/pulls`, 'application/vnd.github+json'),
]);
const pull = relatedPulls.find((candidate) => candidate.base?.ref === 'main') ?? null;
const report = {
  generatedAt: new Date().toISOString(),
  repository,
  workflowRunId: runId,
  expectedSha,
  mainSha: mainCommit.sha ?? null,
  workflowHeadSha: workflowRun.head_sha ?? null,
  workflowStatus: workflowRun.status ?? null,
  workflowConclusion: workflowRun.conclusion ?? null,
  pullRequest: pull ? {
    number: pull.number,
    state: pull.state,
    mergedAt: pull.merged_at ?? null,
    baseRef: pull.base?.ref ?? null,
    headSha: pull.head?.sha ?? null,
  } : null,
  pass: mainCommit.sha === expectedSha
    && workflowRun.head_sha === expectedSha
    && workflowRun.status === 'completed'
    && workflowRun.conclusion === 'success'
    && Boolean(pull?.merged_at)
    && pull?.base?.ref === 'main'
    && Boolean(pull?.head?.sha),
};
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
