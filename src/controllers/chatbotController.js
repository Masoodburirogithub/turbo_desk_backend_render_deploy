// // backend/src/controllers/chatbotController.js
// const { PrismaClient } = require('@prisma/client');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const { sendAdminNotification, sendUserConfirmation } = require('../services/emailService');

// const prisma = new PrismaClient();
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// // Get or create conversation
// const getOrCreateConversation = async (sessionId, userEmail = null, userName = null, userPhone = null) => {
//   let conversation = await prisma.conversation.findUnique({
//     where: { sessionId }
//   });

//   if (!conversation) {
//     conversation = await prisma.conversation.create({
//       data: {
//         sessionId,
//         userEmail,
//         userName,
//         userPhone,
//         status: 'active'
//       }
//     });
//   }

//   return conversation;
// };

// // Send message with Google AI
// const sendMessage = async (req, res) => {
//   try {
//     const { sessionId, message, userEmail, userName, userPhone } = req.body;
//     const io = req.app.get('io');

//     // Get or create conversation
//     let conversation = await getOrCreateConversation(sessionId, userEmail, userName, userPhone);

//     // Save user message
//     await prisma.chatMessage.create({
//       data: {
//         conversationId: conversation.id,
//         message,
//         role: 'user'
//       }
//     });

//     // Get chat history for context
//     const chatHistory = await prisma.chatMessage.findMany({
//       where: { conversationId: conversation.id },
//       orderBy: { createdAt: 'asc' },
//       take: 10
//     });

//     // Build conversation for Gemini
//     const history = chatHistory.map(msg => ({
//       role: msg.role === 'user' ? 'user' : 'model',
//       parts: [{ text: msg.message }]
//     }));

//     // Get AI response from Google Gemini
//     const chat = model.startChat({ history });
//     const result = await chat.sendMessage(message);
//     const aiResponse = result.response.text();

//     // Save AI response
//     await prisma.chatMessage.create({
//       data: {
//         conversationId: conversation.id,
//         message: aiResponse,
//         role: 'assistant'
//       }
//     });

//     // Check if user wants to talk to a real person
//     const wantsHuman = /(talk to (admin|human|real person|agent|representative)|speak to (someone|human)|call me|contact support|need help from real person|human support)/i.test(message);
    
//     if (wantsHuman && conversation.status !== 'waiting_for_admin') {
//       // Update conversation status
//       await prisma.conversation.update({
//         where: { id: conversation.id },
//         data: { status: 'waiting_for_admin' }
//       });

//       // Get conversation summary (last 5 messages)
//       const lastMessages = await prisma.chatMessage.findMany({
//         where: { conversationId: conversation.id },
//         orderBy: { createdAt: 'desc' },
//         take: 5
//       });
      
//       const conversationSummary = lastMessages.reverse().map(m => `${m.role}: ${m.message.substring(0, 100)}`).join('\n');

//       // Send email notification to admin
//       await sendAdminNotification(
//         userName || 'Anonymous',
//         userEmail || 'Not provided',
//         userPhone || 'Not provided',
//         conversationSummary,
//         message
//       );

//       // Send confirmation email to user if email provided
//       if (userEmail) {
//         await sendUserConfirmation(userEmail, userName, process.env.ADMIN_PHONE);
//       }

//       // Notify admin via socket
//       io.to('admin-room').emit('admin-request', {
//         conversationId: conversation.id,
//         sessionId,
//         userName: userName || 'Anonymous',
//         userEmail: userEmail || 'Not provided',
//         userPhone: userPhone || 'Not provided',
//         message: message
//       });

//       // Add special response for user
//       const closureMessage = await prisma.chatMessage.create({
//         data: {
//           conversationId: conversation.id,
//           message: `Thank you for your request! I've notified our support team. They will contact you within 24 hours. You can also reach us directly at:\n\n📞 Phone: ${process.env.ADMIN_PHONE}\n📧 Email: ${process.env.ADMIN_EMAIL}\n\nIs there anything else I can help you with while you wait?`,
//           role: 'assistant'
//         }
//       });

//       return res.json({
//         success: true,
//         message: aiResponse,
//         adminNotified: true,
//         contactInfo: {
//           phone: process.env.ADMIN_PHONE,
//           email: process.env.ADMIN_EMAIL
//         },
//         closureMessage: closureMessage.message
//       });
//     }

//     res.json({
//       success: true,
//       message: aiResponse,
//       conversationId: conversation.id
//     });

//   } catch (error) {
//     console.error('Chatbot error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get chat history
// const getHistory = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const conversation = await prisma.conversation.findUnique({
//       where: { sessionId },
//       include: { messages: { orderBy: { createdAt: 'asc' } } }
//     });

//     res.json({
//       success: true,
//       data: conversation?.messages || [],
//       conversationId: conversation?.id,
//       status: conversation?.status || 'active'
//     });
//   } catch (error) {
//     console.error('Get history error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Clear history
// const clearHistory = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     await prisma.chatMessage.deleteMany({
//       where: { conversation: { sessionId } }
//     });
//     await prisma.conversation.deleteMany({ where: { sessionId } });
//     res.json({ success: true, message: 'History cleared' });
//   } catch (error) {
//     console.error('Clear history error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Admin: Get all conversations
// const getAllConversations = async (req, res) => {
//   try {
//     const conversations = await prisma.conversation.findMany({
//       include: {
//         messages: { orderBy: { createdAt: 'desc' }, take: 1 },
//         adminRequests: true
//       },
//       orderBy: { updatedAt: 'desc' }
//     });
//     res.json({ success: true, data: conversations });
//   } catch (error) {
//     console.error('Get conversations error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = {
//   sendMessage,
//   getHistory,
//   clearHistory,
//   getAllConversations
// };