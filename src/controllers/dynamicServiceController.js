// backend/src/controllers/dynamicServiceController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all dynamic services
const getDynamicServices = async (req, res) => {
  try {
    const services = await prisma.dynamicService.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });
    
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Get dynamic services error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create dynamic service (Admin)
const createDynamicService = async (req, res) => {
  try {
    const { name, path, description, icon, order, isActive } = req.body;
    
    const service = await prisma.dynamicService.create({
      data: {
        name,
        path,
        description: description || null,
        icon: icon || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    
    res.status(201).json({ success: true, data: service, message: 'Service created successfully' });
  } catch (error) {
    console.error('Create dynamic service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update dynamic service (Admin)
const updateDynamicService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, path, description, icon, order, isActive } = req.body;
    
    const service = await prisma.dynamicService.update({
      where: { id },
      data: { name, path, description, icon, order, isActive }
    });
    
    res.json({ success: true, data: service, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update dynamic service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete dynamic service (Admin)
const deleteDynamicService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.dynamicService.delete({ where: { id } });
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete dynamic service error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDynamicServices,
  createDynamicService,
  updateDynamicService,
  deleteDynamicService
};