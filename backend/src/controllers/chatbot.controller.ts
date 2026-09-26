import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { AiService } from '../services/ai.service';
import { emitToChatSession, emitToRole, emitToUser } from '../services/socket.service';

export const handleChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, sessionToken } = req.body;
    const userId = req.user?.id || null;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const token = sessionToken || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Find or create session
    let session = await prisma.chatSession.findUnique({
      where: { sessionToken: token },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          sessionToken: token,
          userId,
          status: 'ACTIVE',
          metadataJson: JSON.stringify({ complaintDraft: {} }),
        },
      });
    } else if (userId && !session.userId) {
      session = await prisma.chatSession.update({
        where: { id: session.id },
        data: { userId },
      });
    }

    // Parse current session metadata
    let metadata: any = {};
    try {
      metadata = session.metadataJson ? JSON.parse(session.metadataJson) : {};
    } catch {
      metadata = {};
    }

    // Save user message
    const userMsg = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: 'USER',
        message: message.trim(),
      },
    });

    emitToChatSession(session.id, 'chat:message', userMsg);

    // Process through AI Engine
    const aiResponse = await AiService.processChatbotMessage(
      message.trim(),
      metadata,
      req.user
    );

    // Update session metadata if draft data updated
    if (aiResponse.extractedData) {
      metadata.complaintDraft = {
        ...(metadata.complaintDraft || {}),
        ...aiResponse.extractedData,
      };
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { metadataJson: JSON.stringify(metadata) },
      });
    }

    // If escalate intent, mark session as ESCALATED
    if (aiResponse.intent === 'ESCALATE') {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { status: 'ESCALATED' },
      });
      emitToRole('AGENT', 'chat:escalated', {
        sessionId: session.id,
        user: req.user,
        message,
      });
    }

    // Save bot message
    const botMsg = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderType: 'BOT',
        message: aiResponse.reply,
        intentDetected: aiResponse.intent,
        confidenceScore: aiResponse.confidence,
        contextJson: JSON.stringify({
          suggestedActions: aiResponse.suggestedActions || [],
          extractedData: aiResponse.extractedData,
        }),
      },
    });

    emitToChatSession(session.id, 'chat:message', botMsg);

    return res.json({
      success: true,
      data: {
        sessionToken: token,
        reply: aiResponse.reply,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        suggestedActions: aiResponse.suggestedActions || [],
        extractedData: aiResponse.extractedData,
        messageId: botMsg.id,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionToken } = req.params;

    const session = await prisma.chatSession.findUnique({
      where: { sessionToken },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return res.json({ success: true, data: { messages: [], status: 'ACTIVE' } });
    }

    const messages = session.messages.map((m) => {
      let context = {};
      try {
        context = m.contextJson ? JSON.parse(m.contextJson) : {};
      } catch {}
      return {
        id: m.id,
        senderType: m.senderType,
        message: m.message,
        intent: m.intentDetected,
        createdAt: m.createdAt,
        ...context,
      };
    });

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionToken: session.sessionToken,
        status: session.status,
        messages,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitComplaintFromChat = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionToken, draft } = req.body;
    let userId = req.user?.id;

    if (!userId) {
      // Find guest/user or fallback to first citizen user
      const guest = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });
      userId = guest?.id || '';
    }

    const title = draft.title || 'Service Request submitted via AI Chatbot';
    const description = draft.description || 'Customer initiated complaint via 24/7 virtual assistant.';
    const categoryId = draft.categoryId;
    const location = draft.location || 'Reported via Chat Assistant';

    // AI Classification if missing
    let resolvedCatId = categoryId;
    let deptId = draft.departmentId;

    if (!resolvedCatId) {
      const cls = await AiService.classifyComplaint(title, description);
      resolvedCatId = cls.categoryId;
      deptId = cls.departmentId;
    } else if (!deptId) {
      const cat = await prisma.category.findUnique({ where: { id: resolvedCatId } });
      deptId = cat?.departmentId;
    }

    const count = await prisma.complaint.count();
    const ticketNumber = `CMP-${new Date().getFullYear()}-${(count + 1001).toString()}`;
    const sentimentInfo = AiService.analyzeSentimentAndUrgency(title, description);
    const embedding = await AiService.generateEmbedding(`${title} ${description}`);

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        userId: userId!,
        title,
        description,
        categoryId: resolvedCatId!,
        departmentId: deptId!,
        priority: draft.priority || sentimentInfo.priority,
        status: 'PENDING',
        location,
        sentiment: sentimentInfo.sentiment,
        sentimentScore: sentimentInfo.sentimentScore,
        urgencyScore: sentimentInfo.urgencyScore,
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        embeddingJson: JSON.stringify(embedding),
        aiSummary: 'Submitted conversationally via ResolvAI Chatbot.',
      },
      include: {
        category: true,
        department: true,
      },
    });

    // Clear session draft
    if (sessionToken) {
      const session = await prisma.chatSession.findUnique({ where: { sessionToken } });
      if (session) {
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { metadataJson: JSON.stringify({ complaintDraft: {} }) },
        });

        // Add confirmation message to chat
        const botConfirm = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            senderType: 'BOT',
            message: `🎉 **Success!** Your complaint has been filed with Ticket ID: **${ticketNumber}**.\n\n• **Title**: ${complaint.title}\n• **Department**: ${complaint.department.name}\n• **Status**: ⏳ Pending Review\n\nYou can track this ticket anytime using your Ticket ID.`,
            intentDetected: 'FILE_COMPLAINT',
            contextJson: JSON.stringify({
              suggestedActions: [
                { label: 'Check Status', action: 'CHECK_STATUS', payload: ticketNumber },
                { label: 'File Another', action: 'START_COMPLAINT' },
              ],
            }),
          },
        });
        emitToChatSession(session.id, 'chat:message', botConfirm);
      }
    }

    emitToRole('ADMIN', 'complaint:created', complaint);
    emitToRole('AGENT', 'complaint:created', complaint);

    return res.status(201).json({
      success: true,
      message: 'Ticket created from chat session',
      data: complaint,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
