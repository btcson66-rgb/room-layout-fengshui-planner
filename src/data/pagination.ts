/**
 * 索引頁與分類頁的每頁文章數。
 *
 * 50 筆是刻意選的：1061 篇 review-ready 文章切成 22 頁，單頁 HTML 約 45 KB
 * （分頁前 /zh/blog/ 是 857 KB），同時分頁導覽列出全部頁碼，
 * 任何一篇文章都在索引頁的兩次點擊內。
 */
export const BLOG_PAGE_SIZE = 50;
export const CATEGORY_PAGE_SIZE = 50;
