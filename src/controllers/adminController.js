const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
  try {
    const [totalContacts, pendingContacts, totalApplications, pendingApplications, totalCaseStudies, activePositions] = await Promise.all([
      prisma.contactSubmission.count(),
      prisma.contactSubmission.count({ where: { status: 'pending' } }),
      prisma.careerApplication.count(),
      prisma.careerApplication.count({ where: { status: 'pending' } }),
      prisma.caseStudy.count(),
      prisma.careerPosition.count({ where: { isActive: true } })
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        totalContacts, 
        pendingContacts, 
        totalApplications, 
        pendingApplications, 
        totalCaseStudies, 
        activePositions 
      } 
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getApplications = async (req, res) => {
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

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const application = await prisma.careerApplication.update({ 
      where: { id }, 
      data: { status } 
    });
    res.json({ success: true, data: application, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add missing contacts functions
const getContacts = async (req, res) => {
  try {
    const contacts = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const contact = await prisma.contactSubmission.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, data: contact, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  getDashboardStats, 
  getApplications, 
  updateApplicationStatus,
  getContacts,
  updateContactStatus
};