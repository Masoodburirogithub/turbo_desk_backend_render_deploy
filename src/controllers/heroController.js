// backend/src/controllers/heroController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get hero settings (Public)
const getHeroSettings = async (req, res) => {
  try {
    let settings = await prisma.heroSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.heroSettings.create({
        data: {
          title: "Ship Production-Ready Systems at AI Speed",
          subtitle: "We combine deep systems engineering with AI-native delivery to build scalable, secure applications in half the time. Zero technical debt. Full IP ownership.",
          badgeText: "Turbo Desk Solutions Leading AI-Augmented Engineering Firm • 2026",
          buttonText: "Launch Your Project",
          buttonLink: "/contact",
          demoButtonText: "Watch Demo",
          stats: [
            { value: "50+", label: "Projects Delivered", icon: "TrendingUp" },
            { value: "<2 weeks", label: "Avg. MVP to Live", icon: "Clock" },
            { value: "100%", label: "Client Satisfaction", icon: "Award" }
          ],
          isActive: true
        }
      });
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get hero settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update hero settings (Admin)
const updateHeroSettings = async (req, res) => {
  try {
    const { title, subtitle, badgeText, buttonText, buttonLink, demoButtonText, stats, videoUrl, isActive } = req.body;
    
    let settings = await prisma.heroSettings.findFirst();
    
    const updateData = {
      title: title || "Ship Production-Ready Systems at AI Speed",
      subtitle: subtitle || "We combine deep systems engineering with AI-native delivery to build scalable, secure applications in half the time. Zero technical debt. Full IP ownership.",
      badgeText: badgeText || "Turbo Desk Solutions Leading AI-Augmented Engineering Firm • 2026",
      buttonText: buttonText || "Launch Your Project",
      buttonLink: buttonLink || "/contact",
      demoButtonText: demoButtonText || "Watch Demo",
      stats: stats || [
        { value: "50+", label: "Projects Delivered", icon: "TrendingUp" },
        { value: "<2 weeks", label: "Avg. MVP to Live", icon: "Clock" },
        { value: "100%", label: "Client Satisfaction", icon: "Award" }
      ],
      isActive: isActive !== undefined ? isActive : true
    };
    
    // Only update videoUrl if provided
    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl;
    }
    
    if (settings) {
      settings = await prisma.heroSettings.update({
        where: { id: settings.id },
        data: updateData
      });
    } else {
      settings = await prisma.heroSettings.create({ data: updateData });
    }
    
    res.json({ success: true, data: settings, message: 'Hero settings updated successfully' });
  } catch (error) {
    console.error('Update hero settings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upload video - Store as base64 in database (PERMANENT)
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file uploaded' });
    }
    
    // Read video file and convert to base64 for permanent storage
    const fs = require('fs');
    const videoBuffer = fs.readFileSync(req.file.path);
    const base64Video = videoBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64Video}`;
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);
    
    // Return the data URL to be stored in database
    res.json({ success: true, data: { videoUrl: dataUrl }, message: 'Video uploaded successfully' });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getHeroSettings, updateHeroSettings, uploadVideo };