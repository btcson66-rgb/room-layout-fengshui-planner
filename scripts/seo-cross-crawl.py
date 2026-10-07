"""Read-only HTML-anchor + sitemap SEO crawler. No indexing API calls.

Python standard library only. Saves response evidence and distinguishes HTTP
errors from fetch failures. Length thresholds are advisory, never release gates.
"""
import argparse
import concurrent.futures
import csv
import gzip
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from collections import Counter, deque
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

UA = 'Fable-SEO-Cross-Audit/1.0'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(url):
    started = time.monotonic()
    try:
        response = urllib.request.build_opener(NoRedirect).open(
            urllib.request.Request(url, headers={'User-Agent': UA}), timeout=25)
    except urllib.error.HTTPError as error:
        response = error
    except Exception as error:
        return {'url': url, 'status': None, 'error': str(error), 'body': '', 'headers': {}}
    with response:
        body = response.read()
        headers = dict((k.lower(), v) for k, v in response.headers.items())
        if headers.get('content-encoding') == 'gzip':
            body = gzip.decompress(body)
        charset = response.headers.get_content_charset() or 'utf-8'
        return {'url': url, 'status': response.code, 'error': None,
                'headers': headers, 'body': body.decode(charset, errors='replace'),
                'seconds': round(time.monotonic() - started, 3)}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title, self.description, self.robots, self.canonical, self.language = '', '', '', '', ''
        self.links, self.hreflang, self.h1 = [], [], []
        self.in_title, self.in_h1 = False, False
        self.refresh = ''
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html': self.language = a.get('lang', '')
        if tag == 'title': self.in_title = True
        if tag == 'h1': self.in_h1 = True; self.h1.append('')
        if tag == 'meta':
            name = a.get('name', '').lower()
            if name == 'description': self.description = a.get('content', '')
            if name in ('robots', 'googlebot', 'bingbot'): self.robots += ' ' + a.get('content', '')
            if a.get('http-equiv', '').lower() == 'refresh': self.refresh = a.get('content', '')
        if tag == 'link':
            rel = a.get('rel', '').lower().split()
            if 'canonical' in rel: self.canonical = a.get('href', '')
            if 'alternate' in rel and 'hreflang' in a: self.hreflang.append({'language': a['hreflang'], 'url': a.get('href', '')})
        if tag == 'a' and 'href' in a:
            self.links.append({'href': a['href'], 'nofollow': 'nofollow' in a.get('rel', '').lower().split()})
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'h1': self.in_h1 = False
    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.in_h1: self.h1[-1] += data


def normalize(url, base):
    url = urllib.parse.urljoin(base, url)
    p = urllib.parse.urlsplit(url)
    if p.scheme not in ('https', 'http'): return None
    return urllib.parse.urlunsplit((p.scheme, p.netloc.lower(), p.path or '/', p.query, ''))


def page_type(url):
    path = urllib.parse.urlsplit(url).path
    for prefix, kind in [('tools', 'Tool'), ('category', 'Category'), ('guides', 'Guide'), ('blog', 'Blog'), ('workflows', 'Workflow'), ('education', 'Education Statistics'), ('app', 'Private App')]:
        if prefix in path.split('/'): return kind
    return 'Homepage' if path in ('/', '/en/', '/zh/', '/zh-tw/') else 'Content'


def crawl(args):
    root = args.origin.rstrip('/') + '/'
    canonical_root = (args.canonical_origin or args.origin).rstrip('/') + '/'
    canonical_host = urllib.parse.urlsplit(canonical_root).netloc
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    raw = out / 'responses'; raw.mkdir(exist_ok=True)
    host = urllib.parse.urlsplit(root).netloc
    def fetch_url(url):
        # Local preview follows production absolute sitemap/anchor URLs locally.
        p = urllib.parse.urlsplit(url)
        if args.canonical_origin and p.netloc == canonical_host:
            q = urllib.parse.urlsplit(root)
            return urllib.parse.urlunsplit((q.scheme, q.netloc, p.path, p.query, ''))
        return url
    def canonical_url(url):
        p = urllib.parse.urlsplit(url); q = urllib.parse.urlsplit(canonical_root)
        return urllib.parse.urlunsplit((q.scheme, q.netloc, p.path, p.query, ''))
    responses = {}
    def fetch(url):
        r = request(url)
        key = hashlib.sha256(url.encode()).hexdigest()
        with gzip.open(raw / (key + '.json.gz'), 'wt', encoding='utf-8') as f:
            json.dump(r, f, ensure_ascii=False)
        return r
    robots = fetch(root + 'robots.txt'); responses[robots['url']] = robots
    robot_parser = urllib.robotparser.RobotFileParser()
    robot_parser.parse(robots['body'].splitlines())
    robots_available = robots['status'] == 200
    seeds = [line.split(':', 1)[1].strip() for line in robots['body'].splitlines() if line.lower().startswith('sitemap:')]
    if not seeds: seeds = [root + 'sitemap.xml', root + 'sitemap-index.xml']
    maps, sitemap_urls, sitemap_errors = [], set(), []
    pending = deque(seeds); seen_maps = set()
    while pending:
        url = fetch_url(normalize(pending.popleft(), root))
        if not url or url in seen_maps: continue
        seen_maps.add(url)
        if urllib.parse.urlsplit(url).netloc != host:
            sitemap_errors.append({'url': url, 'reason': 'external sitemap not fetched'}); continue
        r = fetch(url); responses[url] = r
        entry = {'url': url, 'status': r['status'], 'content_type': r['headers'].get('content-type', ''), 'error': r['error']}
        try:
            if r['status'] != 200: raise ValueError('sitemap does not return 200')
            doc = ET.fromstring(r['body'])
            kind = doc.tag.rsplit('}', 1)[-1]
            if kind not in ('sitemapindex', 'urlset'): raise ValueError('not a sitemap root element')
            locs = [e.text.strip() for e in doc.iter() if e.tag.rsplit('}', 1)[-1] == 'loc' and e.text]
            entry.update({'kind': kind, 'references': len(locs), 'unique_references': len(set(locs))})
            if not locs: sitemap_errors.append({'url': url, 'reason': 'empty active sitemap'})
            if kind == 'sitemapindex': pending.extend(locs)
            else:
                sitemap_urls.update(fetch_url(loc) for loc in locs)
                for loc in locs:
                    if not loc.startswith('https://') or urllib.parse.urlsplit(loc).query:
                        sitemap_errors.append({'url': loc, 'reason': 'non-HTTPS or parameter sitemap URL'})
        except Exception as error:
            entry['parse_error'] = str(error); sitemap_errors.append({'url': url, 'reason': str(error)})
        maps.append(entry)
    records, links, depths = {}, {}, {root: 0}
    queue = set([root] + [normalize(x, root) for x in args.seed])
    extra = set(sitemap_urls)
    blocked = set(); edge_runtime_links = []
    rounds = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        while queue or extra:
            if not queue: queue, extra = extra, set()
            batch = sorted(u for u in queue if u and u not in records)
            queue = set()
            batch = [u for u in batch if urllib.parse.urlsplit(u).netloc == host]
            if args.max_pages: batch = batch[:max(0, args.max_pages-len(records))]
            if not batch: break
            for start in range(0, len(batch), args.workers):
                selected = batch[start:start+args.workers]
                for r in pool.map(fetch, selected):
                    url = r['url']; headers = r['headers']
                    p = Page()
                    is_html = 'text/html' in headers.get('content-type', '').lower()
                    if is_html: p.feed(r['body'])
                    allowed = robot_parser.can_fetch('*', url) if robots_available else None
                    noindex = 'noindex' in (p.robots + ' ' + headers.get('x-robots-tag', '')).lower()
                    canonical = normalize(p.canonical, url) if p.canonical else ''
                    records[url] = {'site': host, 'url': url, 'http_status': r['status'], 'fetch_error': r['error'],
                        'indexable': (r['status'] == 200 and is_html and allowed is not False and not noindex and not p.refresh),
                        'robots_allowed': allowed, 'meta_robots': p.robots.strip(), 'x_robots': headers.get('x-robots-tag', ''),
                        'canonical': canonical, 'in_sitemap': url in sitemap_urls, 'language': p.language, 'page_type': page_type(url),
                        'title': p.title.strip(), 'description': p.description.strip(), 'h1': p.h1, 'hreflang': p.hreflang,
                        'location': normalize(headers.get('location', ''), url) if headers.get('location') else '', 'refresh': p.refresh,
                        'content_type': headers.get('content-type', ''), 'response_seconds': r.get('seconds'), 'is_html': is_html}
                    links[url] = []
                    for anchor in p.links:
                        target = normalize(anchor['href'], url)
                        if target: target = fetch_url(target)
                        if not target or urllib.parse.urlsplit(target).netloc != host: continue
                        links[url].append({'url': target, 'nofollow': anchor['nofollow']})
                        path = urllib.parse.urlsplit(target).path
                        # Cloudflare transforms mailto into a client-decoded edge
                        # endpoint; this is not a repository-owned content URL.
                        # Keep evidence without counting it as a broken page.
                        if path == '/cdn-cgi/l/email-protection':
                            edge_runtime_links.append({'source': url, 'target': target, 'reason': 'Cloudflare email-obfuscation runtime endpoint; source mailto review required'})
                            continue
                        suffix = Path(path).suffix.lower()
                        if urllib.parse.urlsplit(target).query or suffix not in ('', '.html', '.htm'): continue
                        if allowed is False: continue
                        if robots_available and not robot_parser.can_fetch('*', target): blocked.add(target); continue
                        if target not in records: queue.add(target)
                        if url in depths: depths[target] = min(depths.get(target, 10**9), depths[url]+1)
                    for target in [records[url]['location']] + [normalize(h['url'], url) for h in p.hreflang]:
                        if target: target = fetch_url(target)
                        if target and urllib.parse.urlsplit(target).netloc == host and target not in records:
                            extra.add(target)
                if args.delay: time.sleep(args.delay)
            extra.difference_update(records)
            rounds += 1
            print(f'{host}: fetched {len(records)}; anchor queue {len(queue)}; sitemap/alternate queue {len(extra)}', flush=True)
            if args.max_pages and len(records) >= args.max_pages: break
    # Compute true shortest homepage anchor depths after sitemap-driven collection.
    depths = {root: 0}; bfs = deque([root])
    while bfs:
        source = bfs.popleft()
        for edge in links.get(source, []):
            target = edge['url']
            if target in records and target not in depths:
                depths[target] = depths[source]+1; bfs.append(target)
    incoming = {}
    broken, redirect_links, unknown_links = [], [], []
    for source, edges in links.items():
        for edge in edges:
            target = edge['url']
            if not edge['nofollow']: incoming.setdefault(target, set()).add(source)
            if urllib.parse.urlsplit(target).path == '/cdn-cgi/l/email-protection': continue
            target_record = records.get(target)
            if target_record and target_record['http_status'] and target_record['http_status'] >= 400:
                broken.append({'source': source, 'target': target, 'status': target_record['http_status']})
            elif target_record and (target_record['location'] or target_record['refresh']):
                redirect_links.append({'source': source, 'target': target})
            elif not target_record or target_record['fetch_error']:
                unknown_links.append({'source': source, 'target': target})
    qa = []; titles = Counter(); descriptions = Counter(); invalid_sitemap = []; hreflang_issues = []; chains = []
    for url, r in records.items():
        r['incoming_links'] = len(incoming.get(url, set())); r['crawl_depth'] = depths.get(url)
        r['bing_status'] = 'UNKNOWN (supplied aggregate only)'
        if r['fetch_error']: state, reason = 'UNKNOWN', 'fetch failed; no HTTP evidence'
        elif r['http_status'] and r['http_status'] >= 400: state, reason = 'ERROR', 'current HTTP error; inspect source before repair'
        elif r['location'] or r['refresh']: state, reason = 'REDIRECT', 'HTTP or HTML compatibility redirect; inspect intended target'
        elif 'noindex' in (r['meta_robots']+' '+r['x_robots']).lower(): state, reason = 'NOINDEX', 'source policy classification required; do not bulk remove'
        elif r['robots_allowed'] is False: state, reason = 'BLOCKED', 'robots disallow; verify source policy'
        elif r['canonical'] and r['canonical'] != canonical_url(url): state, reason = 'CANONICAL_DUPLICATE', 'alternate canonical; verify source relationship'
        elif r['indexable']: state, reason = 'KEEP_INDEXABLE', 'current HTTP/robots eligibility; quality and search indexing separate'
        else: state, reason = 'UNKNOWN', 'not indexable HTML'
        r['recommended_state'], r['reason'] = state, reason
        if r['in_sitemap'] and (not r['indexable'] or r['canonical'] != canonical_url(url)): invalid_sitemap.append({'url': url, 'state': state, 'canonical': r['canonical']})
        if r['indexable'] and (not r['canonical'] or r['canonical'] == canonical_url(url)):
            flags = []
            if not r['canonical']: flags.append('missing_canonical')
            if not r['title']: flags.append('missing_title')
            elif len(r['title']) > 65: flags.append('title_length_signal')
            if not r['description']: flags.append('missing_description')
            else:
                minimum, maximum = (70, 100) if r['language'].lower().startswith('zh') else (120, 160)
                if len(r['description']) < minimum: flags.append('short_description_signal')
                if len(r['description']) > maximum: flags.append('long_description_signal')
            if not any(x.strip() for x in r['h1']): flags.append('missing_h1')
            if r['crawl_depth'] is None: flags.append('orphan_like')
            if r['incoming_links'] < 2: flags.append('weak_incoming_link_signal')
            titles[r['title']] += 1; descriptions[r['description']] += 1
            qa.append({'url': url, 'title_length': len(r['title']), 'description_length': len(r['description']), 'signals': flags})
        # Hreflang on intentional noindex private/compatibility pages is
        # recorded in pages.json but does not make an indexable-group defect.
        for h in r['hreflang'] if r['indexable'] else []:
            target = fetch_url(normalize(h['url'], url)); t = records.get(target)
            if not t: hreflang_issues.append({'url': url, 'target': target, 'issue': 'NOT_VERIFIED'}); continue
            if t['http_status'] != 200 or not t['indexable'] or t['canonical'] != canonical_url(target):
                hreflang_issues.append({'url': url, 'target': target, 'issue': 'target_not_canonical_indexable_200'})
            if not any(fetch_url(normalize(x['url'], target)) == url for x in t['hreflang']):
                hreflang_issues.append({'url': url, 'target': target, 'issue': 'non_reciprocal'})
        if r['location']:
            route, seen = [url], {url}; current = r
            while current.get('location'):
                target = current['location']; route.append(target)
                if target in seen: break
                seen.add(target); current = records.get(target, {})
            if len(route) > 2 or route[-1] in route[:-1]: chains.append(route)
    for item in qa:
        r = records[item['url']]
        if r['title'] and titles[r['title']] > 1: item['signals'].append('duplicate_title')
        if r['description'] and descriptions[r['description']] > 1: item['signals'].append('duplicate_description')
    summary = {'origin': root, 'canonical_origin': canonical_root, 'captured_at': datetime.now(timezone.utc).isoformat(), 'max_pages': args.max_pages,
        'pages': len(records), 'homepage_anchor_reachable': len(depths), 'sitemap_unique_urls': len(sitemap_urls), 'sitemaps': maps,
        'robots_status': robots['status'], 'robots_available': robots_available, 'status_counts': dict(Counter(str(r['http_status']) for r in records.values())),
        'indexable': sum(r['indexable'] for r in records.values()), 'noindex': sum('noindex' in (r['meta_robots']+' '+r['x_robots']).lower() for r in records.values()),
        'fetch_errors': sum(bool(r['fetch_error']) for r in records.values()), 'sitemap_errors': sitemap_errors,
        'invalid_sitemap_members': invalid_sitemap, 'broken_internal_links': broken, 'redirect_internal_links': redirect_links,
        'unverified_internal_links': unknown_links, 'robots_blocked_not_fetched': sorted(blocked), 'redirect_chains': chains,
        'edge_runtime_links': edge_runtime_links,
        'hreflang_issues': hreflang_issues, 'metadata_qa': qa, 'metadata_signal_counts': dict(Counter(s for q in qa for s in q['signals'])),
        'limitations': ['Static HTML anchors only; JS-generated routes not discovered.', 'Incoming links count distinct source URLs, including navigation; contextual relevance needs review.', 'Bing/Ahrefs page-level status unavailable unless supplied separately.', 'Length is an advisory signal, never a standalone failure.', 'Files and query/state links recorded as unverified, not counted as broken.', 'No search indexing or traffic guarantee.']}
    (out/'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
    (out/'pages.json').write_text(json.dumps(list(records.values()), ensure_ascii=False, indent=2), encoding='utf-8')
    (out/'links.json').write_text(json.dumps(links, ensure_ascii=False, indent=2), encoding='utf-8')
    columns = ['site','url','http_status','indexable','meta_robots','x_robots','canonical','in_sitemap','incoming_links','language','page_type','bing_status','recommended_state','reason']
    with (out/'indexability.csv').open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction='ignore'); writer.writeheader(); writer.writerows(records.values())
    print(json.dumps({k:v for k,v in summary.items() if k in ['pages','homepage_anchor_reachable','sitemap_unique_urls','status_counts','indexable','noindex','fetch_errors','metadata_signal_counts']}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--origin', required=True)
    parser.add_argument('--canonical-origin', help='Production origin when crawling a local preview; remaps absolute links/sitemaps locally')
    parser.add_argument('--out', required=True)
    parser.add_argument('--seed', action='append', default=[])
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--delay', type=float, default=.15)
    parser.add_argument('--max-pages', type=int, default=0, help='0 means no cap; capped runs are PARTIAL')
    crawl(parser.parse_args())
