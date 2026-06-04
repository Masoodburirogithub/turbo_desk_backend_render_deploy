// backend/src/services/ragService.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const prisma = new PrismaClient();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Track greeted users per session to prevent repeated long greetings
const greetedUsers = new Map();

// Extract text from files
function extractTxtText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('TXT extraction error:', error);
    return null;
  }
}

// Index document
async function indexDocument(documentId) {
  try {
    const document = await prisma.ragDocument.findUnique({
      where: { id: documentId }
    });
    
    if (!document) throw new Error('Document not found');
    
    const filePath = path.join(__dirname, '../../uploads/rag', document.filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const content = extractTxtText(filePath);
    
    if (!content) {
      throw new Error('Could not extract text from file');
    }
    
    const chunks = [];
    const chunkSize = 1000;
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push({
        index: chunks.length,
        text: content.substring(i, i + chunkSize)
      });
    }
    
    await prisma.ragDocument.update({
      where: { id: documentId },
      data: {
        content: content,
        chunks: chunks,
        status: 'indexed'
      }
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Indexing error:', error);
    await prisma.ragDocument.update({
      where: { id: documentId },
      data: { status: 'failed' }
    });
    throw error;
  }
}

// Search relevant chunks
async function searchRelevantChunks(query, topK = 5) {
  const documents = await prisma.ragDocument.findMany({
    where: { status: 'indexed', isActive: true }
  });
  
  if (documents.length === 0) {
    return [];
  }
  
  const allChunks = [];
  const queryLower = query.toLowerCase();
  
  const keywords = {
    service: ['service', 'services', 'offer', 'provide', 'solution', 'solutions', 'product', 'products', 'what do you do'],
    pricing: ['price', 'pricing', 'cost', 'package', 'packages', 'plan', 'plans', 'fee', 'charges'],
    support: ['support', 'help', 'assist', 'issue', 'problem', 'troubleshoot'],
    contact: ['contact', 'reach', 'call', 'email', 'phone', 'whatsapp'],
    technology: ['tech', 'technology', 'stack', 'tools', 'framework', 'language']
  };
  
  let queryCategory = null;
  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (queryLower.includes(word)) {
        queryCategory = category;
        break;
      }
    }
    if (queryCategory) break;
  }
  
  for (const doc of documents) {
    if (doc.chunks && Array.isArray(doc.chunks)) {
      for (const chunk of doc.chunks) {
        const chunkLower = chunk.text.toLowerCase();
        let score = 0;
        
        const queryWords = queryLower.split(/\s+/);
        for (const word of queryWords) {
          if (word.length > 2 && chunkLower.includes(word)) {
            const occurrences = (chunkLower.match(new RegExp(word, 'g')) || []).length;
            score += occurrences * 2;
          }
        }
        
        if (queryCategory) {
          const categoryWords = keywords[queryCategory];
          for (const catWord of categoryWords) {
            if (chunkLower.includes(catWord)) {
              score += 3;
            }
          }
        }
        
        const titleLower = doc.title.toLowerCase();
        for (const word of queryWords) {
          if (titleLower.includes(word)) {
            score += 5;
          }
        }
        
        if (score === 0 && chunk.text.length > 100) {
          score = 1;
        }
        
        if (score > 0) {
          allChunks.push({
            text: chunk.text,
            score: score,
            documentTitle: doc.title
          });
        }
      }
    }
  }
  
  allChunks.sort((a, b) => b.score - a.score);
  const topResults = allChunks.slice(0, topK);
  
  if (topResults.length === 0) {
    for (const doc of documents) {
      if (doc.chunks && doc.chunks.length > 0) {
        topResults.push({
          text: doc.chunks[0].text,
          score: 1,
          documentTitle: doc.title
        });
        break;
      }
    }
  }
  
  return topResults;
}

// Get or create user
async function getOrCreateUser(sessionId, name, email, phone) {
  let user = await prisma.ragUser.findUnique({
    where: { sessionId }
  });
  
  if (!user && name) {
    user = await prisma.ragUser.create({
      data: {
        sessionId,
        name: name,
        email: email || null,
        phone: phone || null,
        lastActive: new Date()
      }
    });
  } else if (user && (name || email || phone)) {
    user = await prisma.ragUser.update({
      where: { sessionId },
      data: {
        name: name || user.name,
        email: email || user.email,
        phone: phone || user.phone,
        lastActive: new Date()
      }
    });
  }
  
  return user;
}

// ONLY for actual greeting messages (hi, hello, hey)
// Does NOT trigger for normal questions
function getGreetingResponse(message, userName, hasBeenGreetedBefore = false) {
  const lowerMsg = message.toLowerCase();
  
  // ONLY handle actual greeting words, not every message
  const isGreeting = lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey');
  
  if (!isGreeting) {
    return null; // Not a greeting, let normal RAG handle it
  }
  
  // FIRST TIME GREETING - Full welcome message
  if (!hasBeenGreetedBefore) {
    return `**👋 Hello ${userName || 'there'}!**

I'm your AI assistant for **Turbo Desk Solutions**. I'm here to help you with any questions about our company, services, or solutions.

**💡 Here's what I can help you with:**

• 📋 Company information and background

• 🚀 Our services and solutions

• 💰 Pricing and packages

• 🔧 Technical support

• 📞 Contact information

• 👥 Career opportunities

**✨ Quick Tip:** Type **"Talk to human"** anytime to speak with a real person!

**What would you like to know today?**`;
  }
  
  // SUBSEQUENT GREETINGS - Short and simple, no long welcome
  return `**👋 Hey ${userName || 'there'}!** Good to see you again. What can I help you with today?`;
}

// Contact response
function getContactResponse() {
  return `**👤 Connect with a Real Person**

I understand you'd like to speak with a member of our team. I've notified our support team about your request, and someone will reach out to you shortly.

**📞 You can also contact us directly:**

• **Phone:** +1(000)(000)(0000)

• **Email:** Info@turbodesksolutions.com

• **WhatsApp:** https://wa.me/+1(000)(000)(0000)

• **Office Hours:** Monday - Friday, 9:00 AM - 6:00 PM

**⏱️ Response Time:** We typically respond within 1-2 business hours.

Thank you for your patience! 🙏`;
}

// Generate RAG response
async function generateRagResponse(question, sessionId, userName, userEmail, userPhone) {
  try {
    const user = await getOrCreateUser(sessionId, userName, userEmail, userPhone);
    
    // Check if this is a greeting message (hi, hello, hey)
    const isGreeting = /^(hi|hello|hey)$/i.test(question.trim()) || 
                       /^(hi|hello|hey)[\s!,.?]*$/i.test(question.trim());
    
    // ONLY for greeting messages, show welcome response
    if (isGreeting) {
      const hasBeenGreetedBefore = greetedUsers.has(sessionId);
      const greetingResponse = getGreetingResponse(question, userName, hasBeenGreetedBefore);
      
      if (greetingResponse) {
        // Mark this user as greeted
        greetedUsers.set(sessionId, true);
        
        await prisma.ragConversation.create({
          data: {
            sessionId,
            userId: user?.id,
            question,
            answer: greetingResponse,
            sources: []
          }
        });
        
        return { answer: greetingResponse, sources: [], hasContext: false, user };
      }
    }
    
    // For ALL other messages (not greetings), NEVER say hello again
    // Just answer the question directly
    
    if (question.toLowerCase().includes('talk to human') || 
        question.toLowerCase().includes('talk to admin') ||
        question.toLowerCase().includes('speak to person') ||
        question.toLowerCase().includes('real person')) {
      
      await prisma.chatRequest.create({
        data: {
          sessionId,
          userId: user?.id,
          userName: userName || user?.name,
          userEmail: userEmail || user?.email,
          userPhone: userPhone || user?.phone,
          message: question,
          status: 'pending'
        }
      });
      
      if (user) {
        await prisma.ragUser.update({
          where: { id: user.id },
          data: { wantsHuman: true, status: 'waiting_for_admin' }
        });
      }
      
      const contactResponse = getContactResponse();
      
      await prisma.ragConversation.create({
        data: {
          sessionId,
          userId: user?.id,
          question,
          answer: contactResponse,
          sources: []
        }
      });
      
      return { 
        answer: contactResponse, 
        sources: [], 
        hasContext: false, 
        user,
        adminRequested: true,
        contactInfo: {
          phone: '+1(000)(000)(0000)',
          email: 'Info@turbodesksolutions.com',
          whatsapp: 'https://wa.me/+1(000)(000)(0000)'
        }
      };
    }
    
    // Search for relevant content from uploaded files
    const relevantChunks = await searchRelevantChunks(question);
    
    let context = '';
    const sources = [];
    
    for (const chunk of relevantChunks) {
      context += `[${chunk.documentTitle}]\n${chunk.text}\n\n`;
      sources.push({ title: chunk.documentTitle });
    }
    
    let answer;
    
    if (context) {
      const prompt = `You are a professional AI assistant for Turbo Desk Solutions. Answer based on the following context.

CONTEXT:
${context}

USER QUESTION: ${question}

INSTRUCTIONS:
1. Answer using the information from the context above
2. Do NOT start your answer with "Hello" or any greeting
3. Answer directly and concisely
4. Be helpful and professional

ANSWER:`;

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      answer = response.text;
    } else {
      answer = `**📚 Information Not Found**

I searched my knowledge base but couldn't find specific information about "${question}".

**💡 Here's what you can do:**

• Try asking with different keywords

• Type **"Talk to human"** to speak with our support team

• Contact us directly at Info@turbodesksolutions.com

**Would you like me to connect you with a human support specialist?**`;
    }
    
    await prisma.ragConversation.create({
      data: {
        sessionId,
        userId: user?.id,
        question,
        answer,
        sources
      }
    });
    
    if (user) {
      await prisma.ragUser.update({
        where: { id: user.id },
        data: { lastActive: new Date() }
      });
    }
    
    return { answer, sources, hasContext: context.length > 0, user };
    
  } catch (error) {
    console.error('RAG error:', error);
    return {
      answer: "I'm having trouble right now. Please contact us directly:\n📞 +1(000)(000)(0000)\n📧 Info@turbodesksolutions.com",
      sources: [],
      hasContext: false,
      user: null
    };
  }
}

module.exports = {
  indexDocument,
  searchRelevantChunks,
  generateRagResponse
};