const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { indexDocument, generateRagResponse } = require('../services/ragService');

const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, '../../uploads/rag');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Save user info
const saveUserInfo = async (req, res) => {
  try {
    const { sessionId, name, email, phone } = req.body;
    
    let user = await prisma.ragUser.findUnique({
      where: { sessionId }
    });
    
    if (user) {
      user = await prisma.ragUser.update({
        where: { sessionId },
        data: {
          name: name || user.name,
          email: email || user.email,
          phone: phone || user.phone,
          lastActive: new Date()
        }
      });
    } else if (name) {
      user = await prisma.ragUser.create({
        data: {
          sessionId,
          name,
          email: email || null,
          phone: phone || null,
          lastActive: new Date()
        }
      });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Save user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Ask question
const askQuestion = async (req, res) => {
  try {
    const { question, sessionId, userName, userEmail, userPhone } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const result = await generateRagResponse(
      question, 
      sessionId || 'default', 
      userName, 
      userEmail, 
      userPhone
    );
    
    if (result.adminRequested) {
      const io = req.app.get('io');
      io.emit('admin-notification', {
        type: 'chat_request',
        user: result.user,
        message: question,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      adminRequested: result.adminRequested || false,
      contactInfo: result.contactInfo || null
    });
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get conversations
const getConversations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversations = await prisma.ragConversation.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user conversations by user ID (Admin)
const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // console.log(`📖 Fetching conversations for user ID: ${userId}`);
    
    const user = await prisma.ragUser.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // console.log(`✅ User found: ${user.name || 'Anonymous'} (Session: ${user.sessionId})`);
    
    const conversations = await prisma.ragConversation.findMany({
      where: { sessionId: user.sessionId },
      orderBy: { createdAt: 'asc' }
    });
    
    // console.log(`📝 Found ${conversations.length} conversations`);
    
    res.json({
      success: true,
      data: conversations,
      userInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        sessionId: user.sessionId
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching user conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user conversations',
      error: error.message
    });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');
    
    const document = await prisma.ragDocument.create({
      data: {
        title: title,
        filename: req.file.filename,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: `/uploads/rag/${req.file.filename}`,
        status: 'processing',
        uploadedBy: req.user?.id || 'admin',
        isActive: true
      }
    });
    
    res.json({ success: true, data: document, message: 'Document uploaded successfully!' });
    
    indexDocument(document.id).catch(console.error);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all documents
const getDocuments = async (req, res) => {
  try {
    const documents = await prisma.ragDocument.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.ragDocument.findUnique({ where: { id } });
    
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    
    const filePath = path.join(uploadDir, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await prisma.ragDocument.delete({ where: { id } });
    
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reindex document
const reindexDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.ragDocument.update({
      where: { id },
      data: { status: 'processing' }
    });
    
    indexDocument(id).catch(console.error);
    
    res.json({ success: true, message: 'Reindexing started' });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all users (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.ragUser.findMany({
      include: {
        conversations: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { lastActive: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get pending chat requests (Admin)
const getPendingRequests = async (req, res) => {
  try {
    const requests = await prisma.chatRequest.findMany({
      where: { status: 'pending' },
      orderBy: { requestedAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Accept chat request (Admin)
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await prisma.chatRequest.update({
      where: { id: requestId },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
        adminId: req.user.id,
        adminName: req.user.email
      }
    });
    
    if (request.userId) {
      await prisma.ragUser.update({
        where: { id: request.userId },
        data: { status: 'chatting' }
      });
    }
    
    const io = req.app.get('io');
    io.to(request.sessionId).emit('admin-accepted', {
      message: "An admin has joined the conversation! They will assist you shortly.",
      adminName: req.user.email
    });
    
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  saveUserInfo,
  askQuestion,
  getConversations,
  getUserConversations,
  uploadDocument,
  getDocuments,
  deleteDocument,
  reindexDocument,
  getAllUsers,
  getPendingRequests,
  acceptRequest
};