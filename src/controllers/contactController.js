const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const submitContact = async (req, res) => {
  try {
    const { fullName, email, company, timeline, projectDesc } = req.body;
    
    const contact = await prisma.contactSubmission.create({
      data: { fullName, email, company: company || null, timeline, projectDesc }
    });
    
    const io = req.app.get('io');
    if (io) io.emit('new-contact', contact);
    
    res.status(201).json({ success: true, data: contact, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllContacts = async (req, res) => {
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
    const contact = await prisma.contactSubmission.update({ where: { id }, data: { status } });
    res.json({ success: true, data: contact, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { submitContact, getAllContacts, updateContactStatus };