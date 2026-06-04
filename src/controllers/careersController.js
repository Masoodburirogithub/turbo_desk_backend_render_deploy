// backend/src/controllers/careersController.js
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Ensure upload directory exists
const cvUploadDir = path.join(__dirname, '../../uploads/cvs');
if (!fs.existsSync(cvUploadDir)) {
  fs.mkdirSync(cvUploadDir, { recursive: true });
}

// Get all positions
const getPositions = async (req, res) => {
  try {
    const positions = await prisma.careerPosition.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Apply for position with CV upload
const applyForPosition = async (req, res) => {
  try {
    const { fullName, email, position, portfolioLink, systemIdea, experience, coverLetter } = req.body;
    
    // Handle CV file upload
    let cvUrl = null;
    if (req.file) {
      cvUrl = `/uploads/cvs/${req.file.filename}`;
    }
    
    const application = await prisma.careerApplication.create({
      data: {
        fullName,
        email,
        position,
        cvUrl,
        portfolioLink: portfolioLink || null,
        systemIdea,
        experience: experience ? parseInt(experience) : null,
        coverLetter: coverLetter || null,
        status: 'pending'
      }
    });
    
    const io = req.app.get('io');
    if (io) io.emit('new-application', application);
    
    res.status(201).json({ 
      success: true, 
      data: application, 
      message: 'Application submitted successfully' 
    });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all applications (Admin)
const getAllApplications = async (req, res) => {
  try {
    const applications = await prisma.careerApplication.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update application status (Admin)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const application = await prisma.careerApplication.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download CV (Admin)
const downloadCV = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.careerApplication.findUnique({
      where: { id }
    });
    
    if (!application || !application.cvUrl) {
      return res.status(404).json({ success: false, error: 'CV not found' });
    }
    
    const filePath = path.join(__dirname, '../../', application.cvUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    res.download(filePath, `${application.fullName}_CV.pdf`);
  } catch (error) {
    console.error('Download CV error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create position (Admin)
const createPosition = async (req, res) => {
  try {
    const { title, department, location, type, experience, description, requirements } = req.body;
    
    const position = await prisma.careerPosition.create({
      data: {
        title,
        department,
        location,
        type,
        experience,
        description,
        requirements: requirements || []
      }
    });
    
    res.status(201).json({ 
      success: true, 
      data: position, 
      message: 'Position created successfully' 
    });
  } catch (error) {
    console.error('Create position error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update position (Admin)
const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, location, type, experience, description, requirements, isActive } = req.body;
    
    const position = await prisma.careerPosition.update({
      where: { id },
      data: {
        title,
        department,
        location,
        type,
        experience,
        description,
        requirements,
        isActive
      }
    });
    
    res.json({ 
      success: true, 
      data: position, 
      message: 'Position updated successfully' 
    });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete position (Admin)
const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.careerPosition.delete({ where: { id } });
    
    res.json({ 
      success: true, 
      message: 'Position deleted successfully' 
    });
  } catch (error) {
    console.error('Delete position error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getPositions,
  applyForPosition,
  getAllApplications,
  updateApplicationStatus,
  downloadCV,
  createPosition,
  updatePosition,
  deletePosition
};