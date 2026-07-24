export const reviewReadyBlogSlugs = new Set([
  'air-conditioner-bedroom-layout',
  'beam-over-desk-bed-layout',
  'bed-facing-door-feng-shui',
  'bed-head-against-wall',
  'bed-under-window-solutions',
  'desk-facing-door-layout',
  'furniture-measurement-checklist',
  'mirror-facing-bed-bedroom',
  'room-circulation-width-guide',
  'small-room-storage-zones',
  'square-bedroom-layout',
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
