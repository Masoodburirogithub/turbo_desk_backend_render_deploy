// backend/src/controllers/caseStudyController.js
const { PrismaClient } = require('@prisma/client');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const prisma = new PrismaClient();

// Get all case studies
const getCaseStudies = async (req, res) => {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    
    res.json({
      success: true,
      data: caseStudies,
      count: caseStudies.length
    });
  } catch (error) {
    console.error('Get case studies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get case study by slug (NEW - for dynamic URLs)
const getCaseStudyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Looking for case study with slug:', slug);
    
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { slug: slug }
    });
    
    if (!caseStudy) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }
    
    res.json({ success: true, data: caseStudy });
  } catch (error) {
    console.error('Get case study by slug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get case study by ID (keep for backward compatibility)
const getCaseStudyById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id }
    });
    
    if (!caseStudy) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }
    
    res.json({ success: true, data: caseStudy });
  } catch (error) {
    console.error('Get case study error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create case study
const createCaseStudy = async (req, res) => {
  try {
    const { title, subtitle, industry, technology, challenge, solution, result, imageUrl, displayOrder } = req.body;
    
    if (!title || !industry || !technology || !challenge || !solution || !result) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    // Generate unique slug from title
    const slug = await generateUniqueSlug(prisma, title);
    
    let savedImageUrl = null;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      savedImageUrl = imageUrl;
    } else if (imageUrl && imageUrl.startsWith('http')) {
      savedImageUrl = imageUrl;
    } else if (imageUrl) {
      savedImageUrl = imageUrl;
    }
    
    const caseStudy = await prisma.caseStudy.create({
      data: {
        title,
        slug,  // Save the generated slug
        subtitle: subtitle || null,
        industry,
        technology,
        challenge,
        solution,
        result,
        imageUrl: savedImageUrl,
        displayOrder: displayOrder || 0,
        isActive: true
      }
    });
    
    res.status(201).json({
      success: true,
      data: caseStudy,
      message: 'Case study created successfully'
    });
  } catch (error) {
    console.error('Create case study error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update case study
const updateCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, industry, technology, challenge, solution, result, imageUrl, displayOrder, isActive } = req.body;
    
    const existingCaseStudy = await prisma.caseStudy.findUnique({ where: { id } });
    if (!existingCaseStudy) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }
    
    let savedImageUrl = existingCaseStudy.imageUrl;
    let slug = existingCaseStudy.slug;
    
    // If title changed, generate new slug
    if (title && title !== existingCaseStudy.title) {
      slug = await generateUniqueSlug(prisma, title, id);
    }
    
    if (imageUrl && imageUrl.startsWith('data:image')) {
      savedImageUrl = imageUrl;
    } else if (imageUrl === '') {
      savedImageUrl = null;
    } else if (imageUrl && imageUrl.startsWith('http')) {
      savedImageUrl = imageUrl;
    } else if (imageUrl) {
      savedImageUrl = imageUrl;
    }
    
    const caseStudy = await prisma.caseStudy.update({
      where: { id },
      data: {
        title: title || existingCaseStudy.title,
        slug,  // Update slug if changed
        subtitle: subtitle !== undefined ? subtitle : existingCaseStudy.subtitle,
        industry: industry || existingCaseStudy.industry,
        technology: technology || existingCaseStudy.technology,
        challenge: challenge || existingCaseStudy.challenge,
        solution: solution || existingCaseStudy.solution,
        result: result || existingCaseStudy.result,
        imageUrl: savedImageUrl,
        displayOrder: displayOrder !== undefined ? displayOrder : existingCaseStudy.displayOrder,
        isActive: isActive !== undefined ? isActive : existingCaseStudy.isActive
      }
    });
    
    res.json({
      success: true,
      data: caseStudy,
      message: 'Case study updated successfully'
    });
  } catch (error) {
    console.error('Update case study error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete case study
const deleteCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.caseStudy.delete({ where: { id } });
    res.json({ success: true, message: 'Case study deleted successfully' });
  } catch (error) {
    console.error('Delete case study error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getCaseStudies,
  getCaseStudyById,
  getCaseStudyBySlug,  // Export the new function
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy
};