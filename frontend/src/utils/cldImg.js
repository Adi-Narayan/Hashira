/**
 * Rewrites a Cloudinary image URL to request an auto-quality, auto-format
 * version. Cloudinary generates and caches the optimised copy on first
 * request — subsequent requests are served from their CDN edge.
 *
 * Before: …/upload/v123/filename.jpg   (~1–1.5 MB)
 * After:  …/upload/q_auto,f_auto/v123/filename.jpg  (~60–150 KB WebP)
 *
 * Non-Cloudinary URLs are returned unchanged.
 */
const cldImg = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,f_auto/');
};

export default cldImg;
