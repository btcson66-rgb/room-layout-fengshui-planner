export const reviewReadyBlogSlugs = new Set([
  'bed-head-against-wall',
  'furniture-measurement-checklist',
  'room-circulation-width-guide',
  'student-room-layout-guide',
]);

export const reviewReadyCategorySlugs = new Set([
  'bedroom',
  'feng-shui',
  'room-planning',
]);

export function isReviewReadyBlogSlug(slug) {
  return reviewReadyBlogSlugs.has(slug);
}
