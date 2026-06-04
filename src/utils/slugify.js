// backend/src/utils/slugify.js

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The title to convert to slug
 * @returns {string} - URL-friendly slug
 */
const slugify = (title) => {
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Generate unique slug by checking existing slugs
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} title - Title to generate slug from
 * @param {string} excludeId - ID to exclude when checking (for updates)
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (prisma, title, excludeId = null) => {
  let baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  let existing;
  do {
    if (excludeId) {
      existing = await prisma.caseStudy.findFirst({
        where: {
          slug: slug,
          NOT: { id: excludeId }
        }
      });
    } else {
      existing = await prisma.caseStudy.findUnique({
        where: { slug: slug }
      });
    }
    
    if (existing) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  } while (existing);
  
  return slug;
};

module.exports = { slugify, generateUniqueSlug };