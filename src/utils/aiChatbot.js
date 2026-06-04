const { openai, CHATBOT_SYSTEM_PROMPT } = require('../config/openai');
const { prisma } = require('../config/database');

class AIChatbot {
  async sendMessage(sessionId, userMessage) {
    try {
      // Get recent conversation history (last 10 messages)
      const recentMessages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Prepare messages array for OpenAI
      const messages = [
        { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
        ...recentMessages.reverse().map(msg => ({
          role: msg.role,
          content: msg.message
        })),
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage = completion.choices[0].message.content;

      // Save messages to database
      await prisma.chatMessage.create({
        data: {
          sessionId,
          message: userMessage,
          role: 'user'
        }
      });

      await prisma.chatMessage.create({
        data: {
          sessionId,
          message: assistantMessage,
          role: 'assistant'
        }
      });

      return { success: true, message: assistantMessage };
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        success: false,
        message: "I'm having trouble connecting. Please email hr@aurachronsys.com or try again later.",
        error: error.message
      };
    }
  }

  async getConversationHistory(sessionId) {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return messages;
  }

  async clearConversation(sessionId) {
    await prisma.chatMessage.deleteMany({
      where: { sessionId },
    });
    return { success: true, message: 'Conversation cleared' };
  }
}

module.exports = new AIChatbot();