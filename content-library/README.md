# 內容庫（scheduled content library）

每日排程（fable-daily-content）從這裡取當天到期的文章上線。

## 規則

- 檔名格式：`YYYY-MM-DD__slug.md`（雙底線分隔）。日期＝預定上線日（台北時間）。
- 檔案內容＝最終形態的 blog markdown（frontmatter 完整、slug 不含日期前綴）。
- 上線動作＝`git mv content-library/YYYY-MM-DD__slug.md src/content/blog/slug.md`，
  經 branch → PR → merge 部署（老闆 2026-07-17 授權每日內容 PR 自動合併）。
- 本資料夾在 `src/` 之外，Astro build 不會讀取，未到期內容不會出現在站上。
- 補庫由 CEO 批次進行，寫作紀律沿 Company Vault Content_Queue 規範
  （結構互異防模板化、具體數字、真 FAQ、內鏈工具頁）。
