#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tech_audit.py — 索引能力稽核：找出「頁面存在但 Google 不會收」的原因。

為什麼需要它
------------
內容再好，只要有下面任何一項，該頁就等於不存在：
  robots.txt 擋住 / meta robots noindex / X-Robots-Tag noindex /
  canonical 指向別頁 / 非 200 狀態 / 不在 sitemap / hreflang 沒有回指 /
  標題重複或過長 / 缺 H1

這支腳本從 sitemap 取全站 URL，逐頁抓取後檢查以上每一項，輸出兩份檔案：
  audit.csv      每頁逐項結果
  audit.md       依嚴重度排序的問題清單（先修 BLOCKER）

使用方式
--------
    pip install requests            # 唯一外部相依
    python3 tech_audit.py https://funnytools.win --out audit/funnytools
    python3 tech_audit.py https://roomfeng.win --out audit/roomfeng --limit 400
    python3 tech_audit.py https://worthcalc.win --out audit/worthcalc --concurrency 6

參數
----
    --limit N         最多檢查幾頁（預設 1500）
    --concurrency N   併發數（預設 8；自架站不要超過 10）
    --delay S         每次請求間隔秒數（預設 0.15）
    --include-locale  只檢查特定語系前綴，可重複，如 --include-locale zh
"""

import argparse
import concurrent.futures as cf
import csv
import os
import re
import sys
import time
import urllib.parse as up
import urllib.robotparser as rp
import xml.etree.ElementTree as ET

try:
    import requests
except ImportError:
    sys.exit("需要 requests：pip install requests")

UA = "Mozilla/5.0 (compatible; SEOAudit/1.0; +site-owner-audit)"
HEADERS = {"User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"}
TIMEOUT = 25


# --------------------------------------------------------------------------
# sitemap
# --------------------------------------------------------------------------
def fetch(url, session, allow_redirects=True):
    # A single slow CDN response must not become a false indexing BLOCKER.
    # Retry timeouts only; a persistent timeout still propagates to FETCH_ERROR.
    for attempt in range(3):
        try:
            return session.get(url, headers=HEADERS, timeout=TIMEOUT,
                               allow_redirects=allow_redirects)
        except requests.exceptions.Timeout:
            if attempt == 2:
                raise
            time.sleep(0.5 * (attempt + 1))


def parse_sitemap(url, session, seen=None, depth=0):
    """遞迴展開 sitemap index，回傳所有 <loc>。"""
    if seen is None:
        seen = set()
    if url in seen or depth > 4:
        return []
    seen.add(url)
    out = []
    try:
        r = fetch(url, session)
        if r.status_code != 200:
            print(f"  [sitemap {r.status_code}] {url}", file=sys.stderr)
            return []
        body = r.content
        # 有些站回傳 gzip 但沒設 header
        if body[:2] == b"\x1f\x8b":
            import gzip
            body = gzip.decompress(body)
        root = ET.fromstring(body)
    except Exception as e:  # noqa: BLE001
        print(f"  [sitemap error] {url}: {e}", file=sys.stderr)
        return []

    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    if root.tag.endswith("sitemapindex"):
        for sm in root.findall(f"{ns}sitemap"):
            loc = sm.findtext(f"{ns}loc")
            if loc:
                out += parse_sitemap(loc.strip(), session, seen, depth + 1)
    else:
        for u in root.findall(f"{ns}url"):
            loc = u.findtext(f"{ns}loc")
            if loc:
                out.append(loc.strip())
    return out


def discover_sitemaps(origin, session):
    """從 robots.txt 找 sitemap；找不到就試常見路徑。"""
    found = []
    try:
        r = fetch(up.urljoin(origin, "/robots.txt"), session)
        if r.status_code == 200:
            for line in r.text.splitlines():
                if line.lower().startswith("sitemap:"):
                    found.append(line.split(":", 1)[1].strip())
    except Exception:  # noqa: BLE001
        pass
    if not found:
        for p in ("/sitemap-index.xml", "/sitemap_index.xml", "/sitemap.xml"):
            try:
                if fetch(up.urljoin(origin, p), session).status_code == 200:
                    found.append(up.urljoin(origin, p))
                    break
            except Exception:  # noqa: BLE001
                pass
    return found


# --------------------------------------------------------------------------
# 單頁檢查
# --------------------------------------------------------------------------
RE_TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.S | re.I)
RE_DESC = re.compile(
    r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', re.S | re.I)
RE_ROBOTS = re.compile(
    r'<meta[^>]+name=["\'](?:robots|googlebot)["\'][^>]+content=["\'](.*?)["\']', re.S | re.I)
RE_CANON = re.compile(
    r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](.*?)["\']', re.S | re.I)
RE_H1 = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S | re.I)
RE_H2 = re.compile(r"<h2[^>]*>", re.I)
RE_HREFLANG = re.compile(
    r'<link[^>]+rel=["\']alternate["\'][^>]*hreflang=["\']([^"\']+)["\'][^>]*href=["\']([^"\']+)["\']',
    re.S | re.I)
RE_JSONLD_TYPE = re.compile(r'"@type"\s*:\s*"([A-Za-z]+)"')
RE_TAG = re.compile(r"<[^>]+>")


def strip_tags(s):
    return re.sub(r"\s+", " ", RE_TAG.sub("", s or "")).strip()


def cjk_width(s):
    """中文字算 2 格，粗估 SERP 顯示寬度。Google 約在 ~60 格截斷。"""
    return sum(2 if ord(c) > 0x2E80 else 1 for c in (s or ""))


def check_page(url, session, robots):
    row = {"url": url}
    try:
        r = fetch(url, session, allow_redirects=False)
    except Exception as e:  # noqa: BLE001
        row.update(status="ERR", note=str(e)[:120])
        return row

    row["status"] = r.status_code
    row["x_robots"] = r.headers.get("X-Robots-Tag", "")
    if r.status_code in (301, 302, 307, 308):
        row["redirect_to"] = r.headers.get("Location", "")
        return row
    if r.status_code != 200:
        return row

    html = r.text
    row["bytes"] = len(html)
    m = RE_TITLE.search(html)
    title = strip_tags(m.group(1)) if m else ""
    m = RE_DESC.search(html)
    desc = strip_tags(m.group(1)) if m else ""
    m = RE_ROBOTS.search(html)
    meta_robots = (m.group(1) if m else "").lower()
    m = RE_CANON.search(html)
    canon = (m.group(1) or "").strip() if m else ""
    m = RE_H1.search(html)
    h1 = strip_tags(m.group(1)) if m else ""

    row.update({
        "title": title,
        "title_w": cjk_width(title),
        "desc": desc,
        "desc_w": cjk_width(desc),
        "meta_robots": meta_robots,
        "canonical": canon,
        "h1": h1,
        "h2_count": len(RE_H2.findall(html)),
        "hreflang": ";".join(f"{a}={b}" for a, b in RE_HREFLANG.findall(html)),
        "jsonld": ",".join(sorted(set(RE_JSONLD_TYPE.findall(html)))),
        "text_len": len(strip_tags(re.sub(r"(?s)<(script|style).*?</\1>", " ", html))),
        "robots_allowed": robots.can_fetch(UA, url) if robots else True,
    })

    # canonical 是否自指（正規化掉尾斜線與協定）
    def norm(u):
        if not u:
            return ""
        u = up.urljoin(url, u)
        p = up.urlsplit(u)
        return f"{p.netloc}{p.path.rstrip('/')}".lower()

    row["canonical_self"] = (norm(canon) == norm(url)) if canon else None
    return row


# --------------------------------------------------------------------------
# 問題判定
# --------------------------------------------------------------------------
def diagnose(rows):
    """回傳 [(severity, code, message, url)]。BLOCKER = 這頁進不了索引。"""
    issues = []
    titles = {}
    for r in rows:
        t = (r.get("title") or "").strip()
        if t:
            titles.setdefault(t, []).append(r["url"])

    for r in rows:
        u = r["url"]
        st = r.get("status")

        if st == "ERR":
            issues.append(("BLOCKER", "FETCH_ERROR", r.get("note", ""), u))
            continue
        if isinstance(st, int) and st >= 400:
            issues.append(("BLOCKER", "HTTP_%d" % st, "sitemap 列出但回傳錯誤碼", u))
            continue
        if isinstance(st, int) and 300 <= st < 400:
            issues.append(("BLOCKER", "REDIRECT_IN_SITEMAP",
                           f"sitemap 不該列轉址網址，目前指向 {r.get('redirect_to','')}", u))
            continue

        if "noindex" in (r.get("meta_robots") or ""):
            issues.append(("BLOCKER", "META_NOINDEX", "頁面自己宣告 noindex", u))
        if "noindex" in (r.get("x_robots") or "").lower():
            issues.append(("BLOCKER", "XROBOTS_NOINDEX",
                           f"HTTP 標頭 X-Robots-Tag: {r.get('x_robots')}", u))
        if r.get("robots_allowed") is False:
            issues.append(("BLOCKER", "ROBOTS_TXT_BLOCK", "robots.txt 擋住此路徑", u))
        if r.get("canonical_self") is False:
            issues.append(("BLOCKER", "CANONICAL_ELSEWHERE",
                           f"canonical 指向 {r.get('canonical')}", u))
        if r.get("canonical_self") is None:
            issues.append(("WARN", "CANONICAL_MISSING", "沒有 canonical", u))

        if not r.get("title"):
            issues.append(("BLOCKER", "TITLE_MISSING", "沒有 <title>", u))
        elif r.get("title_w", 0) > 62:
            issues.append(("WARN", "TITLE_TOO_LONG",
                           f"標題寬度 {r['title_w']}（>62 會被截斷）：{r['title'][:40]}", u))
        elif r.get("title_w", 0) < 18:
            issues.append(("WARN", "TITLE_TOO_SHORT",
                           f"標題寬度 {r['title_w']} 太短，浪費 SERP 版面", u))

        if not r.get("desc"):
            issues.append(("WARN", "DESC_MISSING", "沒有 meta description", u))
        elif r.get("desc_w", 0) > 170:
            issues.append(("INFO", "DESC_TOO_LONG", f"描述寬度 {r['desc_w']}", u))

        if not r.get("h1"):
            issues.append(("WARN", "H1_MISSING", "沒有 H1", u))
        if r.get("text_len", 0) < 600:
            issues.append(("WARN", "THIN_CONTENT",
                           f"純文字僅 {r.get('text_len',0)} 字元，容易被判低價值", u))
        if not r.get("jsonld"):
            issues.append(("INFO", "NO_STRUCTURED_DATA", "沒有 JSON-LD 結構化資料", u))

    for t, urls in titles.items():
        if len(urls) > 1:
            issues.append(("WARN", "DUPLICATE_TITLE",
                           f"{len(urls)} 頁共用標題「{t[:40]}」", " | ".join(urls[:5])))

    order = {"BLOCKER": 0, "WARN": 1, "INFO": 2}
    issues.sort(key=lambda x: (order[x[0]], x[1]))
    return issues


def hreflang_check(rows):
    """hreflang 必須互相回指，否則 Google 會忽略整組。"""
    index = {}
    for r in rows:
        pairs = {}
        for kv in (r.get("hreflang") or "").split(";"):
            if "=" in kv:
                k, v = kv.split("=", 1)
                pairs[k] = v
        index[r["url"].rstrip("/")] = pairs
    problems = []
    for u, pairs in index.items():
        for lang, target in pairs.items():
            if lang == "x-default":
                continue
            t = target.rstrip("/")
            if t not in index:
                continue  # 目標不在本次檢查範圍，跳過
            back = index[t]
            if u not in {v.rstrip("/") for v in back.values()}:
                problems.append((u, lang, target))
    return problems


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="索引能力稽核")
    ap.add_argument("origin", help="站台根網址，如 https://roomfeng.win")
    ap.add_argument("--out", default="audit")
    ap.add_argument("--limit", type=int, default=1500)
    ap.add_argument("--concurrency", type=int, default=8)
    ap.add_argument("--delay", type=float, default=0.15)
    ap.add_argument("--include-locale", action="append", default=[])
    args = ap.parse_args()

    origin = args.origin.rstrip("/")
    session = requests.Session()

    # robots.txt：一定要用同一個 requests session 取，不要用
    # RobotFileParser.read()。它自己發的請求沒有 User-Agent，Cloudflare 之類的
    # WAF 會回 403，而 RobotFileParser 把 401/403 靜默當成「全站 Disallow」，
    # 於是每一頁都被誤報成 ROBOTS_TXT_BLOCK。
    # （funnytools.win 實測：這個 bug 造成 727 個假的 blocker。）
    robots = rp.RobotFileParser()
    try:
        r = fetch(up.urljoin(origin, "/robots.txt"), session)
        if r.status_code == 200:
            robots.parse(r.text.splitlines())
            print(f"robots.txt 已讀取（{len(r.text.splitlines())} 行）")
        elif r.status_code in (401, 403):
            robots = None
            print(f"robots.txt 回傳 {r.status_code}（WAF 擋爬蟲，非真正的封鎖）— 視為全部允許")
        elif r.status_code == 404:
            robots = None
            print("robots.txt 不存在（404）— 視為全部允許")
        else:
            robots = None
            print(f"robots.txt 回傳 {r.status_code} — 視為全部允許")
    except Exception as e:  # noqa: BLE001
        robots = None
        print(f"robots.txt 讀不到（{str(e)[:60]}）— 視為全部允許")

    sitemaps = discover_sitemaps(origin, session)
    print(f"找到 sitemap：{sitemaps or '無 — 這本身就是 BLOCKER'}")
    urls = []
    for sm in sitemaps:
        urls += parse_sitemap(sm, session)
    # 去重並保序
    seen = set()
    urls = [u for u in urls if not (u in seen or seen.add(u))]
    if args.include_locale:
        urls = [u for u in urls
                if any(up.urlsplit(u).path.startswith(f"/{loc}/")
                       for loc in args.include_locale)]
    print(f"sitemap URL 數：{len(urls)}（本次檢查上限 {args.limit}）")
    urls = urls[:args.limit]
    if not urls:
        sys.exit("沒有可檢查的 URL。先確認 sitemap 是否存在且被 robots.txt 指出。")

    rows = []
    done = 0
    with cf.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futs = {}
        for u in urls:
            futs[ex.submit(check_page, u, session, robots)] = u
            time.sleep(args.delay)
        for f in cf.as_completed(futs):
            rows.append(f.result())
            done += 1
            if done % 50 == 0:
                print(f"  ...{done}/{len(urls)}")

    os.makedirs(args.out, exist_ok=True)
    cols = ["url", "status", "title", "title_w", "desc", "desc_w", "h1", "h2_count",
            "meta_robots", "x_robots", "canonical", "canonical_self",
            "robots_allowed", "hreflang", "jsonld", "text_len", "bytes",
            "redirect_to", "note"]
    with open(os.path.join(args.out, "audit.csv"), "w", newline="",
              encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    issues = diagnose(rows)
    hl = hreflang_check(rows)

    from collections import Counter
    sev = Counter(i[0] for i in issues)
    code = Counter(i[1] for i in issues)

    L = [f"# 索引能力稽核 — {origin}\n",
         f"sitemap URL：{len(urls)}　實際檢查：{len(rows)}\n",
         f"**BLOCKER {sev['BLOCKER']}　WARN {sev['WARN']}　INFO {sev['INFO']}**\n",
         "## 問題統計\n", "| 代碼 | 數量 |", "|---|---:|"]
    for c, n in code.most_common():
        L.append(f"| {c} | {n} |")

    L.append("\n## BLOCKER — 這些頁等於不存在，最優先修\n")
    b = [i for i in issues if i[0] == "BLOCKER"]
    if not b:
        L.append("（無）\n")
    else:
        L.append("| 代碼 | 說明 | URL |")
        L.append("|---|---|---|")
        for _, c, m, u in b[:200]:
            L.append(f"| {c} | {m[:80]} | {u[:110]} |")

    L.append("\n## WARN — 會壓低排名與 CTR\n")
    L.append("| 代碼 | 說明 | URL |")
    L.append("|---|---|---|")
    for _, c, m, u in [i for i in issues if i[0] == "WARN"][:200]:
        L.append(f"| {c} | {m[:80]} | {u[:110]} |")

    if hl:
        L.append("\n## hreflang 未互相回指（Google 會整組忽略）\n")
        L.append("| 來源 | 語系 | 指向 |")
        L.append("|---|---|---|")
        for u, lang, t in hl[:80]:
            L.append(f"| {u[:70]} | {lang} | {t[:70]} |")

    with open(os.path.join(args.out, "audit.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(L))
    print(f"\n完成：{args.out}/audit.md（BLOCKER {sev['BLOCKER']} 項）")


if __name__ == "__main__":
    main()
