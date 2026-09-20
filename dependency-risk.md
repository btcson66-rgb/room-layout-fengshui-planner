# Moving OS dependency risk — v1.0.0

Reviewed: 2026-09-09

## Accepted advisory

- Package path: `exceljs@4.4.0` → `uuid@8.3.2`.
- Advisory: `GHSA-w5hq-g745-h8pq`, missing buffer bounds check in UUID v3/v5/v6 when a caller supplies a buffer.
- Severity: moderate; `npm audit` reports two entries because the direct ExcelJS package inherits the transitive UUID advisory.
- Product exploitability: low in the current browser export path. Moving OS does not call UUID v3/v5/v6 with a caller-provided buffer and ExcelJS is loaded only when the buyer requests XLSX export.
- Why accepted: npm's offered fix downgrades ExcelJS to 3.4.0 and would replace a fully verified export stack. The launch work order explicitly prohibits a broad Excel rewrite for this advisory.
- Remediation: re-check upstream ExcelJS dependency updates for v1.1; upgrade when ExcelJS ships a compatible UUID fix, then repeat formula, validation, browser, and package QA.

Current audit: 2 moderate, 0 high, 0 critical.

## Performance debt

The lazy ExcelJS browser chunk is approximately 930 KB. It is loaded only on XLSX export. Keep this as v1.1 technical debt; do not trade away workbook correctness during v1.0 launch.
