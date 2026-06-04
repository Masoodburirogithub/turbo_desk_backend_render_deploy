// backend/scripts/checkCaseStudySlugs.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCaseStudySlugs() {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true
      }
    });
    
    console.log('\n📊 Case Studies Slug Status:\n');
    
    if (caseStudies.length === 0) {
      console.log('❌ No case studies found in database.');
    } else {
      caseStudies.forEach(study => {
        const hasSlug = study.slug ? '✅' : '❌';
        console.log(`${hasSlug} ${study.title}`);
        if (study.slug) {
          console.log(`   Slug: ${study.slug}`);
          console.log(`   URL: /case-studies/${study.slug}\n`);
        } else {
          console.log(`   ⚠️  SLUG MISSING! Need to generate slug\n`);
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCaseStudySlugs();