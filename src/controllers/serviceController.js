// backend/src/controllers/serviceController.js
const { PrismaClient } = require('@prisma/client');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const prisma = new PrismaClient();

// Get all services (Public)
const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    
    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single service by ID (Keep for backward compatibility)
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get service by slug (NEW - for dynamic URLs)
const getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Looking for service with slug:', slug);
    
    const service = await prisma.service.findUnique({
      where: { slug }
    });
    
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Get service by slug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create service (Admin)
const createService = async (req, res) => {
  try {
    const { title, description, icon, features, gradient, color, displayOrder, isActive } = req.body;
    
    if (!title || !description || !icon) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Generate unique slug from title
    const slug = await generateUniqueSlugForService(prisma, title);
    
    const service = await prisma.service.create({
      data: {
        title,
        slug,  // Save the slug
        description,
        icon,
        features: features || [],
        gradient: gradient || 'from-blue-500 to-indigo-500',
        color: color || 'blue',
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    
    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update service (Admin)
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, features, gradient, color, displayOrder, isActive } = req.body;
    
    const existingService = await prisma.service.findUnique({ where: { id } });
    if (!existingService) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    
    let slug = existingService.slug;
    
    // If title changed, generate new slug
    if (title && title !== existingService.title) {
      slug = await generateUniqueSlugForService(prisma, title, id);
    }
    
    const service = await prisma.service.update({
      where: { id },
      data: {
        title: title || existingService.title,
        slug,  // Update slug if changed
        description: description || existingService.description,
        icon: icon || existingService.icon,
        features: features !== undefined ? features : existingService.features,
        gradient: gradient || existingService.gradient,
        color: color || existingService.color,
        displayOrder: displayOrder !== undefined ? displayOrder : existingService.displayOrder,
        isActive: isActive !== undefined ? isActive : existingService.isActive
      }
    });
    
    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete service (Admin)
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to generate unique slug for services
async function generateUniqueSlugForService(prisma, title, excludeId = null) {
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

module.exports = {
  getServices,
  getServiceById,
  getServiceBySlug,  // Export new function
  createService,
  updateService,
  deleteService
};