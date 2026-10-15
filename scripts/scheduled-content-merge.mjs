#!/usr/bin/env node
/**
 * 14 天內容行事曆：每天自動合併下一個 PR（由 .github/workflows/scheduled-content-merge.yml 觸發）。
 *
 * 老闆 2026-10-15 核准 PR #132～#145（Day 01～14）全部合併，並要求改成每天由 GitHub 自動合併一個。
 * 這些分支是疊加的（Day N 含 Day 1..N-1），所以必須依序、一天只合併一個。
 *
 * 安全條件（任何一項不成立就不合併，並讓 job 變紅讓人看見）：
 *   1. 佇列中前面的 PR 都已合併；有被關閉而未合併的就停止（佇列被人工中斷）。
 *   2. 今天（Asia/Taipei）已經合併過一個 → 跳過，不算失敗。
 *   3. main 上最近一次 Deploy to Cloudflare Pages 必須是 success（前一天的發布沒壞）。
 *   4. 目標 PR 的所有 check run 都已完成且通過。
 *   5. 目標 PR mergeable（無衝突）。
 * 合併後主動觸發部署：用 GITHUB_TOKEN 合併不會產生 push 事件，部署 workflow 不會自己跑。
 *
 * 行事曆全部合併後本 workflow 只會回報 done；之後可以刪除這兩個檔案。
 */
import fs from 'node:fs';

export const QUEUE = [132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145];
export const TIME_ZONE = 'Asia/Taipei';
const DEPLOY_WORKFLOW = 'deploy-cloudflare-pages.yml';
const PASSING = new Set(['success', 'neutral', 'skipped']);

export function dateIn(timeZone, value) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * 純函式：依佇列中各 PR 的狀態決定今天要做什麼。
 * prs: 依佇列順序的 [{ number, state, merged, merged_at }]
 */
export function decideNext(prs, today, timeZone = TIME_ZONE) {
  for (const pr of prs) {
    if (pr.merged) {
      if (pr.merged_at && dateIn(timeZone, pr.merged_at) === today) {
        return { action: 'skip', pr: pr.number, reason: `今天（${today}）已經發布過 #${pr.number}，一天只合併一個` };
      }
      continue;
    }
    if (pr.state !== 'open') {
      return { action: 'blocked', pr: pr.number, reason: `#${pr.number} 已被關閉但未合併，佇列中斷，需要人工確認` };
    }
    return { action: 'merge', pr: pr.number, reason: `下一個待發布：#${pr.number}` };
  }
  return { action: 'done', pr: null, reason: '行事曆的 PR 已全部合併' };
}

/** 純函式：check run 是否全部完成且通過。 */
export function checksPassed(checkRuns) {
  if (!checkRuns.length) return { ok: false, reason: '沒有任何 check run' };
  const pending = checkRuns.filter((run) => run.status !== 'completed');
  if (pending.length) return { ok: false, reason: `仍在執行：${pending.map((run) => run.name).join('、')}` };
  const failed = checkRuns.filter((run) => !PASSING.has(run.conclusion));
  if (failed.length) return { ok: false, reason: `未通過：${failed.map((run) => `${run.name}=${run.conclusion}`).join('、')}` };
  return { ok: true, reason: `${checkRuns.length} 個 check run 全部通過` };
}

// 部署後的 production Lighthouse 門檻在網站已經上線之後才跑，量的是 runner 上的實驗室 TBT，
// 同一個 commit 會隨機過或不過（2026-10-14 run 38642045473：首頁 mobile TBT 437ms，四小時前同 commit 通過）。
// 它失敗不代表網站壞了，所以「唯一失敗的步驟是這個門檻」時只記警告、不擋發布；其他任何步驟失敗都要擋。
// 只放行「Run production Lighthouse gate」本身；部署前的 Chromium 安裝等名稱也含 Lighthouse 的步驟失敗仍要擋。
export const NON_BLOCKING_FAILED_STEPS = [/^Run production Lighthouse gate\b/];

/**
 * 純函式：main 上最近一次完成的部署是否健康。runs 為 API 回傳順序（新到舊）；
 * failedSteps 為最近一次完成的 run 中 conclusion=failure 的步驟名稱。
 */
export function deployHealthy(runs, failedSteps = []) {
  const latest = runs.find((run) => run.status === 'completed');
  if (!latest) return { ok: false, reason: '找不到已完成的部署紀錄' };
  if (latest.conclusion === 'success') return { ok: true, reason: `最近一次部署成功：${latest.html_url}` };
  const blocking = failedSteps.filter((name) => !NON_BLOCKING_FAILED_STEPS.some((pattern) => pattern.test(name)));
  if (latest.conclusion === 'failure' && failedSteps.length > 0 && blocking.length === 0) {
    return { ok: true, reason: `警告：最近一次部署 ${latest.html_url} 只有部署後的 Lighthouse 門檻失敗（${failedSteps.join('、')}），網站已上線，繼續發布` };
  }
  return {
    ok: false,
    reason: `最近一次部署 ${latest.html_url} 結論為 ${latest.conclusion}${blocking.length ? `（失敗步驟：${blocking.join('、')}）` : ''}，暫停發布`,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) throw new Error('需要 GITHUB_TOKEN 與 GITHUB_REPOSITORY');
  const api = async (path, options = {}) => {
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        ...(options.body ? { 'content-type': 'application/json' } : {}),
      },
    });
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path} → HTTP ${response.status}：${text.slice(0, 300)}`);
    return json;
  };
  const summary = [];
  const report = (line) => {
    console.log(line);
    summary.push(line);
  };
  const finish = (code) => {
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.map((line) => `- ${line}`).join('\n')}\n`);
    process.exitCode = code;
  };

  const today = dateIn(TIME_ZONE, Date.now());
  const prs = [];
  for (const number of QUEUE) prs.push(await api(`/repos/${repo}/pulls/${number}`));
  const decision = decideNext(prs, today);
  report(`今天 ${today}（${TIME_ZONE}）：${decision.reason}`);
  if (decision.action === 'skip' || decision.action === 'done') return finish(0);
  if (decision.action === 'blocked') return finish(1);

  // 3. 前一次部署必須成功；正在跑就等它（最多 20 分鐘）。
  for (let attempt = 0; ; attempt += 1) {
    const { workflow_runs: runs } = await api(`/repos/${repo}/actions/workflows/${DEPLOY_WORKFLOW}/runs?branch=main&per_page=10`);
    const running = runs.find((run) => run.status !== 'completed');
    if (running && attempt < 20) {
      console.log(`部署仍在執行（${running.html_url}），等待 60 秒…`);
      await sleep(60_000);
      continue;
    }
    const latest = runs.find((run) => run.status === 'completed');
    let failedSteps = [];
    if (latest && latest.conclusion === 'failure') {
      const { jobs } = await api(`/repos/${repo}/actions/runs/${latest.id}/jobs`);
      failedSteps = jobs.flatMap((job) => (job.steps ?? []).filter((step) => step.conclusion === 'failure').map((step) => step.name));
    }
    const health = deployHealthy(runs, failedSteps);
    report(health.reason);
    if (!health.ok) return finish(1);
    break;
  }

  // 4. 目標 PR 的 CI。
  let pr = prs.find((item) => item.number === decision.pr);
  const { check_runs: checkRuns } = await api(`/repos/${repo}/commits/${pr.head.sha}/check-runs?per_page=100`);
  const checks = checksPassed(checkRuns);
  report(`#${pr.number} CI：${checks.reason}`);
  if (!checks.ok) return finish(1);

  // 5. 可合併（mergeable 可能先是 null，GitHub 背景計算中）。
  for (let attempt = 0; pr.mergeable === null && attempt < 6; attempt += 1) {
    await sleep(10_000);
    pr = await api(`/repos/${repo}/pulls/${pr.number}`);
  }
  if (pr.mergeable !== true) {
    report(`#${pr.number} 無法合併（mergeable=${pr.mergeable}，mergeable_state=${pr.mergeable_state}），需要人工處理衝突`);
    return finish(1);
  }

  if (pr.draft) {
    await api('/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: 'mutation($id: ID!) { markPullRequestReadyForReview(input: { pullRequestId: $id }) { pullRequest { isDraft } } }',
        variables: { id: pr.node_id },
      }),
    });
    report(`#${pr.number} 已從草稿改為 ready for review`);
  }

  const merged = await api(`/repos/${repo}/pulls/${pr.number}/merge`, {
    method: 'PUT',
    body: JSON.stringify({
      merge_method: 'merge',
      sha: pr.head.sha,
      commit_title: `Merge pull request #${pr.number} from ${pr.head.ref}`,
      commit_message: `${pr.title}\n\n由 scheduled-content-merge 依 14 天內容行事曆自動合併（老闆 2026-10-15 核准）。`,
    }),
  });
  report(`已合併 #${pr.number}（${pr.title}），merge commit ${merged.sha}`);

  await api(`/repos/${repo}/actions/workflows/${DEPLOY_WORKFLOW}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: 'main' }),
  });
  report('已觸發 Deploy to Cloudflare Pages（main）');
  return finish(0);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  await main();
}
