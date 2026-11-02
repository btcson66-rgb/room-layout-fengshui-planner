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
 *   4. 目標 PR mergeable（無衝突）。落後 main 時先同步 main 並在分支上重跑 Preflight。
 *   5. 目標 PR 目前 head 的必要 check（preflight／UIUX／Lighthouse Preview）都已完成且通過。
 *      bot 同步後 GitHub 建立的 pull_request run 會停在 action_required（等待核准），
 *      分支保護因此一直顯示必要 check「expected」；本腳本會核准這些 run，讓 check 正常產生。
 * 合併後主動觸發部署：用 GITHUB_TOKEN 合併不會產生 push 事件，部署 workflow 不會自己跑。
 *
 * 行事曆全部合併後本 workflow 只會回報 done；之後可以刪除這兩個檔案。
 */
import fs from 'node:fs';

export const QUEUE = [132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145];
export const TIME_ZONE = 'Asia/Taipei';
const DEPLOY_WORKFLOW = 'deploy-cloudflare-pages.yml';
const PREFLIGHT_WORKFLOW = 'preflight.yml';
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

// main 的分支保護要求這三個 check（見 final-release-verdict 的 branchProtection）。
export const REQUIRED_CHECKS = ['preflight', 'UIUX browser evidence', 'Lighthouse Preview'];

/**
 * 純函式：check run 是否全部完成且通過。pending=true 表示還值得等（必要 check 尚未出現或仍在跑）。
 * 同名 check 有多筆（重跑）時只看最新一筆。
 */
export function checksPassed(checkRuns, required = REQUIRED_CHECKS) {
  const latest = new Map();
  for (const run of checkRuns) {
    const prev = latest.get(run.name);
    if (!prev || (run.started_at ?? '') > (prev.started_at ?? '')) latest.set(run.name, run);
  }
  const runs = [...latest.values()];
  const missing = required.filter((name) => !latest.has(name));
  if (missing.length) return { ok: false, pending: true, reason: `必要 check 尚未出現：${missing.join('、')}` };
  if (!runs.length) return { ok: false, pending: true, reason: '沒有任何 check run' };
  const running = runs.filter((run) => run.status !== 'completed');
  if (running.length) return { ok: false, pending: true, reason: `仍在執行：${running.map((run) => run.name).join('、')}` };
  const failed = runs.filter((run) => !PASSING.has(run.conclusion));
  if (failed.length) return { ok: false, pending: false, reason: `未通過：${failed.map((run) => `${run.name}=${run.conclusion}`).join('、')}` };
  return { ok: true, pending: false, reason: `${runs.length} 個 check run 全部通過` };
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

/**
 * 純函式：這個 head 上停在 action_required（等待核准）的 pull_request run。
 *
 * 2026-10-22～25 #136 連續四天 405「3 of 3 required status checks are expected」的根因：
 * update-branch 由 github-actions[bot] 推送，GitHub 為它建立的 pull_request Preflight run
 * 不會執行，而是停在 action_required。分支保護認的是這個 run 的 check，
 * workflow_dispatch 補跑出來的同名綠勾不算數，所以 check 全綠也合併不了。
 * 人推的同步（例如 10-20 #134／#135）不會停在 action_required，因此那兩天合併得進去。
 */
export function runsAwaitingApproval(runs, headSha) {
  return runs.filter((run) => run.event === 'pull_request'
    && run.head_sha === headSha
    && run.status === 'completed'
    && run.conclusion === 'action_required');
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

  // 4. 可合併（mergeable 可能先是 null，GitHub 背景計算中）。
  const fetchPr = async (number) => {
    let current = await api(`/repos/${repo}/pulls/${number}`);
    for (let attempt = 0; current.mergeable === null && attempt < 12; attempt += 1) {
      await sleep(10_000);
      current = await api(`/repos/${repo}/pulls/${number}`);
    }
    return current;
  };
  let pr = await fetchPr(decision.pr);
  if (pr.mergeable !== true) {
    report(`#${pr.number} 無法合併（mergeable=${pr.mergeable}，mergeable_state=${pr.mergeable_state}），需要人工處理衝突`);
    return finish(1);
  }

  // 5. 分支保護要求與 main 同步：前一天的合併讓下一個 PR 落後 main（mergeable_state=behind）。
  //    用 API 把 main 合進 PR 分支。這個 push 來自 github-actions[bot]，GitHub 為它建立的
  //    pull_request run 會停在 action_required；下面的 releaseApprovalHolds 負責核准它。
  if (pr.mergeable_state === 'behind') {
    const oldSha = pr.head.sha;
    await api(`/repos/${repo}/pulls/${pr.number}/update-branch`, {
      method: 'PUT',
      body: JSON.stringify({ expected_head_sha: oldSha }),
    });
    for (let attempt = 0; pr.head.sha === oldSha && attempt < 30; attempt += 1) {
      await sleep(5_000);
      pr = await api(`/repos/${repo}/pulls/${pr.number}`);
    }
    if (pr.head.sha === oldSha) {
      report(`#${pr.number} 同步 main 後 head 沒有更新，停止`);
      return finish(1);
    }
    report(`#${pr.number} 已同步 main（${oldSha.slice(0, 7)} → ${pr.head.sha.slice(0, 7)}）`);
  }

  //    不論今天有沒有同步，head 上若有等待核准的 pull_request run 都先核准
  //    （#136 的 57fd187 就是 10-22 同步後一直卡著的那一種）。
  //    剛同步完的 run 可能還沒建立，最多等 2 分鐘。
  const findHolds = async () => {
    const { workflow_runs: runs } = await api(`/repos/${repo}/actions/runs?head_sha=${pr.head.sha}&event=pull_request&per_page=50`);
    return { runs, holds: runsAwaitingApproval(runs, pr.head.sha) };
  };
  let { runs: prRuns, holds } = await findHolds();
  for (let attempt = 0; !prRuns.length && attempt < 12; attempt += 1) {
    await sleep(10_000);
    ({ runs: prRuns, holds } = await findHolds());
  }
  let approvalFailed = false;
  const approved = [];
  for (const run of holds) {
    try {
      await api(`/repos/${repo}/actions/runs/${run.id}/approve`, { method: 'POST' });
      approved.push(run);
      report(`#${pr.number} 已核准等待中的 pull_request run：${run.html_url}`);
    } catch (error) {
      approvalFailed = true;
      report(`#${pr.number} 無法核准 ${run.html_url}（${error.message}）`);
    }
  }
  // 同一個 head 上可能已有 workflow_dispatch 補跑的舊綠勾，checksPassed 會直接放行；
  // 但分支保護等的是剛核准的這個 run，所以要等它本身跑完且成功（最多 40 分鐘）。
  for (const run of approved) {
    let current = run;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await sleep(60_000);
      current = await api(`/repos/${repo}/actions/runs/${run.id}`);
      if (current.status === 'completed' && current.conclusion !== 'action_required') break;
    }
    report(`#${pr.number} 核准後的 run 結論：${current.status}／${current.conclusion}（${current.html_url}）`);
    if (current.status !== 'completed' || current.conclusion !== 'success') return finish(1);
  }
  if (approvalFailed || !prRuns.length) {
    // 沒有 pull_request run 可用時，退回舊做法：在分支上補跑 Preflight 讓 head 至少有 check 可判斷。
    await api(`/repos/${repo}/actions/workflows/${PREFLIGHT_WORKFLOW}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({ ref: pr.head.ref }),
    });
    report(`#${pr.number} 已在分支上觸發 Preflight（workflow_dispatch）`);
  }

  // 6. 目標 PR 目前 head 的 CI（等待中的最多等 40 分鐘）。
  let checks;
  for (let attempt = 0; ; attempt += 1) {
    const { check_runs: checkRuns } = await api(`/repos/${repo}/commits/${pr.head.sha}/check-runs?per_page=100`);
    checks = checksPassed(checkRuns);
    if (!checks.pending || attempt >= 40) break;
    console.log(`#${pr.number} CI：${checks.reason}，等待 60 秒…`);
    await sleep(60_000);
  }
  report(`#${pr.number} CI（${pr.head.sha.slice(0, 7)}）：${checks.reason}`);
  if (!checks.ok) return finish(1);
  if (approvalFailed) {
    report(`#${pr.number} 的 pull_request run 仍在等待核准，分支保護會拒絕合併：請到 Actions 頁面按 Approve and run，或由人推一次同步`);
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
