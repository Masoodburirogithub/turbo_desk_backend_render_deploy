// backend/src/controllers/demoController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Submit demo request
const submitDemoRequest = async (req, res) => {
  try {
    const { businessEmail, company, firstName, lastName, jobTitle, phoneNumber } = req.body;
    
    // Validate required fields
    if (!businessEmail || !company || !firstName || !lastName || !jobTitle || !phoneNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const demoRequest = await prisma.demoRequest.create({
      data: {
        businessEmail,
        company,
        firstName,
        lastName,
        jobTitle,
        phoneNumber,
        status: 'pending'
      }
    });
    
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-demo-request', {
        id: demoRequest.id,
        company: demoRequest.company,
        email: demoRequest.businessEmail,
        timestamp: new Date()
      });
    }
    
    res.status(201).json({
      success: true,
      data: demoRequest,
      message: 'Demo request submitted successfully'
    });
    
  } catch (error) {
    console.error('Demo request error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all demo requests (Admin)
const getAllDemoRequests = async (req, res) => {
  try {
    const requests = await prisma.demoRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get demo requests error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update demo request status (Admin)
const updateDemoRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const request = await prisma.demoRequest.update({
      where: { id },
      data: { status }
    });
    
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete demo request (Admin)
const deleteDemoRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.demoRequest.delete({ where: { id } });
    res.json({ success: true, message: 'Demo request deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  submitDemoRequest,
  getAllDemoRequests,
  updateDemoRequestStatus,
  deleteDemoRequest
};