"""Offline integration tests for crawler evidence and regression gates."""
import importlib.util
import json
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


class Fixture(BaseHTTPRequestHandler):
    def do_GET(self):
        origin = 'https://fixture.example'
        path = self.path
        status, kind = 200, 'text/html; charset=utf-8'
        if path == '/robots.txt':
            kind = 'text/plain'; body = f'User-agent: *\nDisallow: /blocked/\nSitemap: {origin}/sitemap.xml'
        elif path == '/sitemap.xml':
            kind = 'application/xml'; body = f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{origin}/</loc></url><url><loc>{origin}/hidden/</loc></url></urlset>'
        elif path == '/redirect/':
            self.send_response(301); self.send_header('Location', '/'); self.end_headers(); return
        elif path == '/broken/': status, body = 404, 'Missing'
        else:
            robots = '<meta name="robots" content="noindex,follow">' if path == '/hidden/' else ''
            links = '<a href="https://fixture.example/hidden/">hidden</a><a href="/redirect/">redirect</a><a href="/broken/">broken</a><a href="/blocked/">blocked</a><a href="/cdn-cgi/l/email-protection#abc">email</a>' if path == '/' else ''
            body = f'<html lang="en"><head><title>A fixture</title><meta name="description" content="Useful concise description."><link rel="canonical" href="{origin}{path}">{robots}</head><body><h1>Fixture</h1>{links}</body></html>'
        data = body.encode(); self.send_response(status); self.send_header('Content-Type', kind); self.end_headers(); self.wfile.write(data)
    def log_message(self, *args): pass


class CrawlerTests(unittest.TestCase):
    def test_live_fixture_and_comparison(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                out = Path(directory)/'before'
                subprocess.run([sys.executable, str(SCRIPTS/'seo-cross-crawl.py'), '--origin', f'http://127.0.0.1:{server.server_port}', '--canonical-origin', 'https://fixture.example', '--out', str(out), '--delay', '0'], check=True, capture_output=True)
                summary = json.loads((out/'summary.json').read_text(encoding='utf-8'))
                pages = json.loads((out/'pages.json').read_text(encoding='utf-8'))
                self.assertEqual(summary['pages'], 4)
                self.assertEqual(summary['noindex'], 1)
                self.assertEqual(summary['homepage_anchor_reachable'], 4)
                self.assertEqual(len(summary['invalid_sitemap_members']), 1)
                self.assertEqual(len(summary['broken_internal_links']), 1)
                self.assertEqual(len(summary['redirect_internal_links']), 1)
                self.assertEqual(len(summary['edge_runtime_links']), 1)
                self.assertEqual(len(summary['robots_blocked_not_fetched']), 1)
                self.assertEqual(summary['fetch_errors'], 0)
                spec = importlib.util.spec_from_file_location('compare', SCRIPTS/'seo-cross-compare.py')
                module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
                # A clean synthetic baseline isolates regression detection from
                # the intentionally broken fixture (never a production pass).
                summary.update(invalid_sitemap_members=[], broken_internal_links=[], redirect_chains=[], hreflang_issues=[])
                (out/'summary.json').write_text(json.dumps(summary), encoding='utf-8')
                after = Path(directory)/'after'; after.mkdir()
                for filename in ['summary.json', 'pages.json']:
                    (after/filename).write_bytes((out/filename).read_bytes())
                self.assertEqual(module.compare(out, after)['result'], 'PASS')
                pages[0]['indexable'] = not pages[0]['indexable']
                (after/'pages.json').write_text(json.dumps(pages), encoding='utf-8')
                self.assertEqual(module.compare(out, after)['result'], 'PARTIAL')
                self.assertTrue(any(e.get('field') == 'indexable' for e in module.compare(out, after)['errors']))
        finally:
            server.shutdown(); server.server_close(); thread.join()


if __name__ == '__main__': unittest.main()
