import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { AiService } from '../services/ai.service';
import { emitToComplaint, emitToRole, emitToUser } from '../services/socket.service';

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, categoryId, location, priority: userPriority } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    // 1. AI Classification & Triage
    let resolvedCategoryId = categoryId;
    let resolvedDepartmentId = '';
    let classificationInfo: any = null;

    if (!resolvedCategoryId) {
      classificationInfo = await AiService.classifyComplaint(title, description);
      resolvedCategoryId = classificationInfo.categoryId;
      resolvedDepartmentId = classificationInfo.departmentId;
    } else {
      const cat = await prisma.category.findUnique({
        where: { id: resolvedCategoryId },
        include: { department: true },
      });
      if (cat) {
        resolvedDepartmentId = cat.departmentId;
      }
    }

    // Fallback if department still unknown
    if (!resolvedDepartmentId) {
      const firstDept = await prisma.department.findFirst();
      resolvedDepartmentId = firstDept?.id || '';
    }

    // 2. AI Sentiment & Urgency Scoring
    const sentimentInfo = AiService.analyzeSentimentAndUrgency(title, description);
    const finalPriority = userPriority || sentimentInfo.priority;

    // 3. AI Duplicate / Semantic Similarity Check
    const duplicateCheck = await AiService.findSimilarComplaints(title, description);

    // 4. Generate Semantic Embedding
    const embedding = await AiService.generateEmbedding(`${title} ${description} ${location || ''}`);

    // 5. Calculate SLA Deadline from Rules
    let resolutionHours = 24; // default
    const slaRule = await prisma.slaRule.findFirst({
      where: {
        categoryId: resolvedCategoryId,
        priority: finalPriority,
      },
    });

    if (slaRule) {
      resolutionHours = slaRule.resolutionTimeHours;
    } else {
      if (finalPriority === 'CRITICAL') resolutionHours = 4;
      else if (finalPriority === 'HIGH') resolutionHours = 12;
      else if (finalPriority === 'MEDIUM') resolutionHours = 24;
      else resolutionHours = 48;
    }
    const slaDeadline = new Date(Date.now() + resolutionHours * 60 * 60 * 1000);

    // 6. Auto-Assign to Available Agent in Department
    const availableAgent = await prisma.user.findFirst({
      where: {
        role: 'AGENT',
        departmentId: resolvedDepartmentId,
      },
      include: {
        _count: {
          select: {
            assignedComplaints: {
              where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
            },
          },
        },
      },
      orderBy: {
        assignedComplaints: {
          _count: 'asc',
        },
      },
    });

    const assignedStaffId = availableAgent ? availableAgent.id : null;

    // 7. Generate Ticket Number
    const count = await prisma.complaint.count();
    const ticketNumber = `CMP-${new Date().getFullYear()}-${(count + 1001).toString()}`;

    // 8. Generate AI Suggested Response for Agents
    const catObj = await prisma.category.findUnique({ where: { id: resolvedCategoryId } });
    const aiSuggestedDraft = await AiService.generateAutoResponseDraft({
      title,
      description,
      category: catObj || undefined,
      priority: finalPriority,
      userName: req.user?.name,
    });

    // 9. Save Complaint
    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        userId,
        title,
        description,
        categoryId: resolvedCategoryId,
        departmentId: resolvedDepartmentId,
        priority: finalPriority,
        status: 'PENDING',
        location: location || null,
        sentiment: sentimentInfo.sentiment,
        sentimentScore: sentimentInfo.sentimentScore,
        urgencyScore: sentimentInfo.urgencyScore,
        assignedStaffId,
        slaDeadline,
        embeddingJson: JSON.stringify(embedding),
        aiSummary: sentimentInfo.rationale,
        aiSuggestedDraft,
        duplicateOfId: duplicateCheck.isDuplicate && duplicateCheck.matchedComplaints[0]
          ? duplicateCheck.matchedComplaints[0].id
          : null,
      },
      include: {
        category: true,
        department: true,
        assignedStaff: { select: { id: true, name: true, email: true, avatar: true } },
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // 10. Handle File Attachments if present
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      for (const f of files) {
        await prisma.complaintAttachment.create({
          data: {
            complaintId: complaint.id,
            fileName: f.originalname,
            fileUrl: `/uploads/${f.filename}`,
            fileType: f.mimetype,
            fileSize: f.size,
          },
        });
      }
    }

    // 11. Initial Status History
    await prisma.statusHistory.create({
      data: {
        complaintId: complaint.id,
        oldStatus: 'NONE',
        newStatus: 'PENDING',
        changedById: userId,
        note: `Ticket created via portal. AI auto-assigned to ${complaint.department.name} with priority ${finalPriority}.`,
      },
    });

    // 12. Create Notifications
    await prisma.notification.create({
      data: {
        userId,
        title: `Complaint Submitted (${ticketNumber})`,
        message: `Your complaint "${title}" has been registered and auto-routed to ${complaint.department.name}.`,
        type: 'STATUS_UPDATE',
        linkUrl: `/complaints/${complaint.id}`,
      },
    });

    if (assignedStaffId) {
      await prisma.notification.create({
        data: {
          userId: assignedStaffId,
          title: `New Ticket Assigned (${ticketNumber})`,
          message: `Priority: ${finalPriority}. "${title}"`,
          type: 'ASSIGNMENT',
          linkUrl: `/staff/complaints/${complaint.id}`,
        },
      });
      emitToUser(assignedStaffId, 'notification:new', {
        title: `New Ticket Assigned (${ticketNumber})`,
        message: title,
      });
    }

    // Real-time broadcast
    emitToRole('ADMIN', 'complaint:created', complaint);
    emitToRole('AGENT', 'complaint:created', complaint);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaint,
        aiInsights: {
          sentiment: sentimentInfo,
          duplicateCheck,
          classification: classificationInfo,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      priority,
      categoryId,
      departmentId,
      search,
      mine,
      assignedToMe,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};

    // Role-based restrictions
    if (req.user?.role === 'CITIZEN' || mine === 'true') {
      where.userId = req.user?.id;
    } else if (assignedToMe === 'true' && req.user?.id) {
      where.assignedStaffId = req.user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
        { ticketNumber: { contains: search as string } },
        { location: { contains: search as string } },
      ];
    }

    const [total, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          department: true,
          assignedStaff: { select: { id: true, name: true, email: true, avatar: true } },
          user: { select: { id: true, name: true, email: true, avatar: true } },
          feedback: true,
          _count: { select: { attachments: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: complaints,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getComplaintById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }],
      },
      include: {
        category: true,
        department: true,
        assignedStaff: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        attachments: true,
        feedback: true,
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true, role: true, avatar: true } },
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Role check: Citizens can only see their own tickets unless staff/admin
    if (req.user?.role === 'CITIZEN' && complaint.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Fetch similar complaints for agent insight
    let similarTickets: any[] = [];
    if (complaint.title && complaint.description) {
      const sim = await AiService.findSimilarComplaints(
        complaint.title,
        complaint.description,
        complaint.id
      );
      similarTickets = sim.matchedComplaints;
    }

    return res.json({
      success: true,
      data: {
        ...complaint,
        similarTickets,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint status.' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { user: true, assignedStaff: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const oldStatus = complaint.status;
    const isResolved = status === 'RESOLVED' && oldStatus !== 'RESOLVED';

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        resolvedAt: isResolved ? new Date() : complaint.resolvedAt,
      },
      include: {
        category: true,
        department: true,
        assignedStaff: { select: { id: true, name: true, email: true, avatar: true } },
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Log status history
    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        oldStatus,
        newStatus: status,
        changedById: req.user!.id,
        note: note || `Status transitioned from ${oldStatus} to ${status}.`,
      },
    });

    // Notify ticket owner
    await prisma.notification.create({
      data: {
        userId: complaint.userId,
        title: `Ticket Status Updated: ${status}`,
        message: `Your ticket ${complaint.ticketNumber} is now ${status}. ${note || ''}`,
        type: 'STATUS_UPDATE',
        linkUrl: `/complaints/${complaint.id}`,
      },
    });

    // Real-time events
    emitToUser(complaint.userId, 'complaint:status-changed', {
      id: complaint.id,
      ticketNumber: complaint.ticketNumber,
      status,
      note,
    });
    emitToComplaint(complaint.id, 'complaint:updated', updated);
    emitToRole('ADMIN', 'complaint:updated', updated);
    emitToRole('AGENT', 'complaint:updated', updated);

    return res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    const staff = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: { assignedStaffId: staffId },
      include: {
        assignedStaff: { select: { id: true, name: true, email: true, avatar: true } },
        category: true,
        department: true,
      },
    });

    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        oldStatus: updated.status,
        newStatus: updated.status,
        changedById: req.user!.id,
        note: `Reassigned to support specialist ${staff.name}.`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: staffId,
        title: `Ticket Assigned (${updated.ticketNumber})`,
        message: `You have been assigned: "${updated.title}"`,
        type: 'ASSIGNMENT',
        linkUrl: `/staff/complaints/${updated.id}`,
      },
    });

    emitToUser(staffId, 'notification:new', {
      title: `Ticket Assigned (${updated.ticketNumber})`,
      message: updated.title,
    });
    emitToComplaint(id, 'complaint:updated', updated);

    return res.json({
      success: true,
      message: `Assigned to ${staff.name}`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the ticket submitter can leave feedback.' });
    }

    const feedback = await prisma.feedback.upsert({
      where: { complaintId: id },
      update: { rating: Number(rating), comment },
      create: { complaintId: id, rating: Number(rating), comment },
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: feedback,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkDuplicates = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title && !description) {
      return res.status(400).json({ success: false, message: 'Title or description required.' });
    }

    const result = await AiService.findSimilarComplaints(title || '', description || '');
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
