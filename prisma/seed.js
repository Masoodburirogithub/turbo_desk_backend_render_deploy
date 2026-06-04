// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { slugify } = require('../src/utils/slugify');

const prisma = new PrismaClient();

// Helper function to generate unique slug
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

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminEmail = 'admin@aurachron.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      }
    });
    console.log('✅ Admin user created');
  } else {
    console.log('⏭️  Admin user already exists');
  }

  // Create sample case studies
  const existingCaseStudies = await prisma.caseStudy.count();
  
  if (existingCaseStudies === 0) {
    const caseStudies = [
      {
        title: 'AI-Powered Customer Support Transformation',
        slug: await generateUniqueSlugForService('AI-Powered Customer Support Transformation'),
        subtitle: 'How we reduced response time by 85% using AI agents',
        industry: 'Customer Service',
        technology: 'LLM, RAG, AI Agents',
        challenge: 'The company was struggling with high volume of customer inquiries, long response times, and inconsistent service quality.',
        solution: 'We implemented a custom AI agent with RAG pipeline that could understand context, access knowledge base, and provide accurate responses.',
        result: '85% reduction in response time, 60% cost savings, and 95% customer satisfaction rate.',
        displayOrder: 1,
        isActive: true
      },
      {
        title: 'Real Estate Platform Modernization',
        slug: await generateUniqueSlugForService('Real Estate Platform Modernization'),
        subtitle: 'Modernizing property management with AI',
        industry: 'PropTech',
        technology: 'AI, Cloud, Analytics',
        challenge: 'Outdated property management system causing inefficiencies and poor user experience.',
        solution: 'Built a modern AI-powered platform with predictive analytics and automated workflows.',
        result: '40% increase in operational efficiency, 50% faster property listings.',
        displayOrder: 2,
        isActive: true
      },
      {
        title: 'Supply Chain Optimization',
        slug: await generateUniqueSlugForService('Supply Chain Optimization'),
        subtitle: 'AI-driven logistics and inventory management',
        industry: 'Logistics',
        technology: 'Machine Learning, IoT',
        challenge: 'Inefficient supply chain leading to stockouts and excess inventory.',
        solution: 'Implemented ML models for demand forecasting and automated reordering.',
        result: '30% reduction in stockouts, 25% decrease in inventory costs.',
        displayOrder: 3,
        isActive: true
      }
    ];

    for (const study of caseStudies) {
      await prisma.caseStudy.create({ data: study });
    }
    console.log('✅ Sample case studies created');
  } else {
    console.log('⏭️  Case studies already exist');
  }

  // Create sample services with slugs
  const existingServices = await prisma.service.count();
  
  if (existingServices === 0) {
    const services = [
      {
        title: 'AI Development & Agents',
        slug: await generateUniqueSlugForService('AI Development & Agents'),
        description: 'Custom AI agents, LLM integrations, RAG pipelines, and AI enablement — from strategy to production',
        icon: 'Brain',
        features: [
          'Agentic AI Solutions',
          'LLM Integration & RAG',
          'AI Enablement Consulting',
          'Intelligent Document Processing'
        ],
        gradient: 'from-blue-500 to-indigo-500',
        color: 'blue',
        displayOrder: 1,
        isActive: true
      },
      {
        title: 'Cloud & DevOps Solutions',
        slug: await generateUniqueSlugForService('Cloud & DevOps Solutions'),
        description: 'Scalable cloud infrastructure, CI/CD pipelines, and DevOps automation for modern applications',
        icon: 'Cloud',
        features: [
          'Cloud Migration',
          'CI/CD Implementation',
          'Infrastructure as Code',
          '24/7 Cloud Monitoring'
        ],
        gradient: 'from-cyan-500 to-blue-500',
        color: 'cyan',
        displayOrder: 2,
        isActive: true
      },
      {
        title: 'Mobile App Development',
        slug: await generateUniqueSlugForService('Mobile App Development'),
        description: 'Native and cross-platform mobile applications with modern UI/UX and robust backend integration',
        icon: 'Smartphone',
        features: [
          'iOS & Android Development',
          'React Native & Flutter',
          'App Store Optimization',
          'Maintenance & Support'
        ],
        gradient: 'from-green-500 to-teal-500',
        color: 'green',
        displayOrder: 3,
        isActive: true
      },
      {
        title: 'Cybersecurity Services',
        slug: await generateUniqueSlugForService('Cybersecurity Services'),
        description: 'Comprehensive security solutions to protect your business from evolving cyber threats',
        icon: 'Shield',
        features: [
          'Security Audits',
          'Penetration Testing',
          'Compliance Management',
          'Threat Monitoring'
        ],
        gradient: 'from-purple-500 to-pink-500',
        color: 'purple',
        displayOrder: 4,
        isActive: true
      },
      {
        title: 'Data Analytics & BI',
        slug: await generateUniqueSlugForService('Data Analytics & BI'),
        description: 'Transform raw data into actionable insights with advanced analytics and business intelligence',
        icon: 'TrendingUp',
        features: [
          'Data Warehousing',
          'Dashboard Development',
          'Predictive Analytics',
          'Real-time Reporting'
        ],
        gradient: 'from-orange-500 to-red-500',
        color: 'orange',
        displayOrder: 5,
        isActive: true
      },
      {
        title: 'Digital Transformation',
        slug: await generateUniqueSlugForService('Digital Transformation'),
        description: 'End-to-end digital transformation services to modernize your business operations',
        icon: 'RefreshCw',
        features: [
          'Process Automation',
          'Legacy Modernization',
          'Digital Strategy',
          'Change Management'
        ],
        gradient: 'from-indigo-500 to-purple-500',
        color: 'indigo',
        displayOrder: 6,
        isActive: true
      }
    ];

    for (const service of services) {
      await prisma.service.create({ data: service });
    }
    console.log('✅ Sample services created with slugs');
  } else {
    console.log('⏭️  Services already exist');
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });