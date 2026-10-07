"""Compare crawl outputs by path and fail on unintended SEO regressions.

Descriptions/titles can change without breaking this gate. Indexability,
canonical, robots, reciprocal hreflang, active sitemaps and status cannot.
Use --allow-path only for a separately reviewed intentional repair.
"""
import argparse
import json
import urllib.parse
from pathlib import Path


def key(url):
    p = urllib.parse.urlsplit(url)
    return p.path + ('?' + p.query if p.query else '')


def compare(before_path, after_path, allowed=()):
    before = {key(r['url']): r for r in json.loads((Path(before_path)/'pages.json').read_text(encoding='utf-8'))}
    after = {key(r['url']): r for r in json.loads((Path(after_path)/'pages.json').read_text(encoding='utf-8'))}
    errors, changes = [], []
    for path, a in before.items():
        b = after.get(path)
        if path in allowed: continue
        if not b:
            errors.append({'path': path, 'issue': 'missing_after'}); continue
        for field in ['http_status', 'indexable', 'meta_robots', 'x_robots', 'canonical', 'in_sitemap']:
            if a.get(field) != b.get(field):
                errors.append({'path': path, 'field': field, 'before': a.get(field), 'after': b.get(field)})
        def alternates(r):
            return sorted((h['language'], key(h['url'])) for h in r.get('hreflang', []))
        if alternates(a) != alternates(b): errors.append({'path': path, 'issue': 'hreflang_changed'})
        for field in ['title', 'description', 'h1']:
            if a.get(field) != b.get(field): changes.append({'path': path, 'field': field, 'before': a.get(field), 'after': b.get(field)})
    for path, b in after.items():
        if path not in before and path not in allowed and (b.get('indexable') or b.get('in_sitemap')):
            errors.append({'path': path, 'issue': 'unreviewed_new_indexable_or_sitemap_page'})
    summary = json.loads((Path(after_path)/'summary.json').read_text(encoding='utf-8'))
    for field in ['invalid_sitemap_members', 'sitemap_errors', 'broken_internal_links', 'redirect_chains', 'hreflang_issues']:
        if summary.get(field): errors.append({'issue': field, 'count': len(summary[field])})
    if summary.get('fetch_errors'): errors.append({'issue': 'unverified_fetches', 'count': summary['fetch_errors']})
    if summary.get('max_pages'): errors.append({'issue': 'capped_crawl_is_partial'})
    return {'result': 'PASS' if not errors else 'PARTIAL', 'before_pages': len(before), 'after_pages': len(after), 'allowed_paths': list(allowed), 'errors': errors, 'editorial_changes': changes,
            'scope': 'Static production/local crawl comparison; does not establish deployment or search indexing.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--before', required=True); p.add_argument('--after', required=True)
    p.add_argument('--allow-path', action='append', default=[]); p.add_argument('--out', required=True)
    a = p.parse_args(); result = compare(a.before, a.after, a.allow_path)
    Path(a.out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k != 'editorial_changes'}, ensure_ascii=False))
    raise SystemExit(0 if result['result'] == 'PASS' else 1)
