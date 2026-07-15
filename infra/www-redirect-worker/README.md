# RoomFeng www canonical redirect

`https://www.roomfeng.win/*` used to serve the same Cloudflare Pages HTML as the apex host. This edge-only Worker returns a permanent redirect to `https://roomfeng.win/*`, preserving the complete path and query string.

The main Astro site remains static. The Worker has no bindings, secrets, storage, subrequests, analytics payloads, or application logic; it only performs host canonicalization.

## Verify

```powershell
npm.cmd run test:www-redirect
wrangler.cmd deploy --dry-run --config infra/www-redirect-worker/wrangler.jsonc
```

## Deploy

Run only after the branch has passed preflight and been merged:

```powershell
npm.cmd run deploy:www-redirect
```

The authenticated Cloudflare identity needs `Workers Scripts:Edit` and `Workers Routes:Edit` for the `roomfeng.win` zone.

## Live proof

Check both the root and a deep URL. The expected response is `301` with the same path and query string on the apex host:

```powershell
curl.exe -I https://www.roomfeng.win/
curl.exe -I "https://www.roomfeng.win/zh/room-layout-planner/?probe=1"
```

## Rollback

```powershell
wrangler.cmd delete --config infra/www-redirect-worker/wrangler.jsonc
```

After rollback, verify that `https://roomfeng.win/` still returns `200` and record the reason in the company incident log.
