// backend/src/controllers/pageSettingController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get page settings
const getPageSettings = async (req, res) => {
  try {
    const { page, section } = req.params;
    const settings = await prisma.pageSetting.findUnique({
      where: { page: `${page}_${section}` }
    });
    
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get page settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update page settings (Admin)
const updatePageSettings = async (req, res) => {
  try {
    const { page, section } = req.params;
    const { title, subtitle, description, metadata } = req.body;
    
    const settings = await prisma.pageSetting.upsert({
      where: { page: `${page}_${section}` },
      update: { title, subtitle, description, metadata },
      create: {
        page: `${page}_${section}`,
        section,
        title,
        subtitle,
        description,
        metadata
      }
    });
    
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update page settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getPageSettings, updatePageSettings };