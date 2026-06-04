// backend/scripts/generateCaseStudySlugs.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Slugify function
function slugify(title) {
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function generateUniqueSlug(title, excludeId = null) {
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
}

async function generateSlugs() {
  try {
    console.log('🚀 Starting slug generation for case studies...\n');
    
    // Get all case studies
    const caseStudies = await prisma.caseStudy.findMany();
    
    if (caseStudies.length === 0) {
      console.log('No case studies found in database.');
      return;
    }
    
    console.log(`📊 Found ${caseStudies.length} case studies\n`);
    
    let updated = 0;
    
    for (const study of caseStudies) {
      // Check if slug is missing
      if (!study.slug) {
        const slug = await generateUniqueSlug(study.title, study.id);
        
        await prisma.caseStudy.update({
          where: { id: study.id },
          data: { slug: slug }
        });
        
        console.log(`✅ "${study.title.substring(0, 40)}${study.title.length > 40 ? '...' : ''}" -> ${slug}`);
        updated++;
      } else {
        console.log(`⏭️  Already has slug: ${study.slug}`);
      }
    }
    
    console.log(`\n✨ Updated ${updated} case studies with slugs!\n`);
    
    // Verify the updates
    const updatedStudies = await prisma.caseStudy.findMany({
      select: { title: true, slug: true }
    });
    
    console.log('📋 Verification:');
    updatedStudies.forEach(study => {
      console.log(`   ${study.title}: ${study.slug || '❌ MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error generating slugs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
generateSlugs();