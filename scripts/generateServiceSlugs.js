// backend/scripts/generateServiceSlugs.js
const { PrismaClient } = require('@prisma/client');
const { slugify } = require('../src/utils/slugify');

const prisma = new PrismaClient();

async function generateUniqueSlugForService(title, excludeId = null) {
  let baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  let existing;
  do {
    if (excludeId) {
      existing = await prisma.service.findFirst({
        where: {
          slug: slug,
          NOT: { id: excludeId }
        }
      });
    } else {
      existing = await prisma.service.findUnique({
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
    console.log('🚀 Starting slug generation for services...\n');
    
    const services = await prisma.service.findMany();
    
    if (services.length === 0) {
      console.log('No services found in database.');
      return;
    }
    
    console.log(`📊 Found ${services.length} services\n`);
    
    let updated = 0;
    
    for (const service of services) {
      if (!service.slug) {
        const slug = await generateUniqueSlugForService(service.title, service.id);
        
        await prisma.service.update({
          where: { id: service.id },
          data: { slug: slug }
        });
        
        console.log(`✅ "${service.title.substring(0, 40)}${service.title.length > 40 ? '...' : ''}" -> ${slug}`);
        updated++;
      } else {
        console.log(`⏭️  Already has slug: ${service.slug}`);
      }
    }
    
    console.log(`\n✨ Updated ${updated} services with slugs!\n`);
    
  } catch (error) {
    console.error('Error generating slugs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateSlugs();