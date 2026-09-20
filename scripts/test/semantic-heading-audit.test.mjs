import assert from 'node:assert/strict';
import test from 'node:test';

import { auditHtml } from '../semantic-heading-audit.mjs';

test('semantic heading audit accepts a normal indexable document', () => {
  const result = auditHtml('<main><h1>Room planner</h1><section><h2>Check</h2><h3>Details</h3></section></main>', 'fixture.html');
  assert.equal(result.pass, true);
});

test('semantic heading audit rejects duplicate and out-of-order headings', () => {
  const result = auditHtml('<main><h2>Tool</h2><h1>Page</h1><h1>Duplicate</h1><h3>Details</h3></main>', 'fixture.html');
  assert.equal(result.pass, false);
  assert.match(result.failures.join(' '), /exactly one H1/);
  assert.match(result.failures.join(' '), /first H1 must precede first H2/);
});

test('semantic heading audit skips explicitly noindex documents', () => {
  const result = auditHtml('<head><meta name="robots" content="noindex"></head><h2>Utility</h2>', '404.html');
  assert.equal(result.indexable, false);
  assert.equal(result.pass, true);
});

test('semantic heading audit ignores heading-like markup inside scripts and styles', () => {
  const result = auditHtml('<script>widget.innerHTML = "<h2>Consent</h2>";</script><style>h2 { color: red; }</style><main><h1>Room planner</h1><h2>Check</h2></main>', 'fixture.html');
  assert.equal(result.pass, true);
  assert.deepEqual(result.headings.map((heading) => heading.level), [1, 2]);
});
