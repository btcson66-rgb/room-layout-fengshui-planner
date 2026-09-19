/** Neutralize cells that spreadsheet applications may interpret as formulas. */
export function sanitizeSpreadsheetCell(value: unknown): string {
  const text = String(value ?? '');
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}
