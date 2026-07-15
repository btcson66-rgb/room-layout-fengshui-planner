export const reviewReadyBlogSlugs = new Set([
  'air-conditioner-bedroom-layout',
  'bed-head-against-wall',
  'bed-under-window-solutions',
  'furniture-measurement-checklist',
  'room-circulation-width-guide',
  'small-room-storage-zones',
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
