import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to generate simple embeddings for seeding semantic search
function generateMockEmbedding(text: string): number[] {
  const dim = 64;
  const vector = new Array(dim).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % dim;
    vector[idx] += 1;
  }
  // Normalize
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => +(v / norm).toFixed(4));
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.feedback.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.complaintAttachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.slaRule.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.faqItem.deleteMany();

  // 1. Departments
  const deptTech = await prisma.department.create({
    data: {
      name: 'Technical & IT Services',
      description: 'Handles software bugs, connectivity issues, network outages, and digital service bugs.'
    }
  });

  const deptBilling = await prisma.department.create({
    data: {
      name: 'Billing & Finance',
      description: 'Manages invoicing, payment gateway errors, refund disputes, and account fees.'
    }
  });

  const deptWorks = await prisma.department.create({
    data: {
      name: 'Public Works & Infrastructure',
      description: 'Maintains public roads, water lines, street lighting, waste disposal, and municipal safety.'
    }
  });

  const deptSupport = await prisma.department.create({
    data: {
      name: 'Customer Support & Operations',
      description: 'Customer inquiries, delivery status, operational escalations, and general service delivery.'
    }
  });

  const deptHR = await prisma.department.create({
    data: {
      name: 'Human Resources & Staff Conduct',
      description: 'Handles staff grievance, professional conduct, customer harassment, and ethics review.'
    }
  });

  console.log('✅ Created 5 departments');

  // 2. Categories
  const catInternet = await prisma.category.create({
    data: {
      name: 'Internet & Connectivity',
      description: 'Broadband failure, slow bandwidth, fiber cut, or DNS latency issues.',
      departmentId: deptTech.id,
      defaultPriority: 'HIGH',
      keywordsJson: JSON.stringify(['internet', 'wifi', 'broadband', 'offline', 'dns', 'fiber', 'latency', 'connection', 'network'])
    }
  });

  const catAppGlitch = await prisma.category.create({
    data: {
      name: 'Software & App Glitch',
      description: 'Application crashes, 500 server errors, login failures, or UI responsiveness bugs.',
      departmentId: deptTech.id,
      defaultPriority: 'MEDIUM',
      keywordsJson: JSON.stringify(['app', 'bug', 'glitch', 'crash', 'error', 'failed', 'login', 'portal', 'website'])
    }
  });

  const catBilling = await prisma.category.create({
    data: {
      name: 'Billing & Overcharge',
      description: 'Discrepancies in invoices, incorrect monthly statements, or unauthorized charges.',
      departmentId: deptBilling.id,
      defaultPriority: 'HIGH',
      keywordsJson: JSON.stringify(['bill', 'invoice', 'overcharge', 'fee', 'charge', 'deducted', 'pricing', 'statement'])
    }
  });

  const catRefund = await prisma.category.create({
    data: {
      name: 'Refund & Payment Processing',
      description: 'Failed transactions, delayed refunds, duplicate bank debits.',
      departmentId: deptBilling.id,
      defaultPriority: 'HIGH',
      keywordsJson: JSON.stringify(['refund', 'payment', 'transaction', 'gateway', 'bank', 'duplicate payment', 'money back'])
    }
  });

  const catRoads = await prisma.category.create({
    data: {
      name: 'Road Hazard & Potholes',
      description: 'Dangerous road potholes, broken asphalt, missing manhole covers, missing street signs.',
      departmentId: deptWorks.id,
      defaultPriority: 'HIGH',
      keywordsJson: JSON.stringify(['pothole', 'road', 'asphalt', 'manhole', 'street', 'hazard', 'traffic', 'accident'])
    }
  });

  const catWater = await prisma.category.create({
    data: {
      name: 'Water Supply & Contamination',
      description: 'Burst pipelines, low water pressure, contaminated or discolored municipal water.',
      departmentId: deptWorks.id,
      defaultPriority: 'CRITICAL',
      keywordsJson: JSON.stringify(['water', 'pipe', 'leak', 'burst', 'contamination', 'dirty water', 'supply', 'sewage'])
    }
  });

  const catDelivery = await prisma.category.create({
    data: {
      name: 'Delayed Delivery & Logistics',
      description: 'Consignment not arrived, tracking stalled, lost shipment or damaged package.',
      departmentId: deptSupport.id,
      defaultPriority: 'MEDIUM',
      keywordsJson: JSON.stringify(['delivery', 'courier', 'package', 'shipping', 'tracking', 'delay', 'transit', 'lost'])
    }
  });

  const catStaffConduct = await prisma.category.create({
    data: {
      name: 'Staff Behavior & Ethics',
      description: 'Unprofessional behavior, rude staff interaction, bribe solicitation, or policy abuse.',
      departmentId: deptHR.id,
      defaultPriority: 'HIGH',
      keywordsJson: JSON.stringify(['staff', 'employee', 'rude', 'behavior', 'harassment', 'unprofessional', 'bribe', 'conduct'])
    }
  });

  console.log('✅ Created 8 categories');

  // 3. SLA Rules
  const categoriesList = [catInternet, catAppGlitch, catBilling, catRefund, catRoads, catWater, catDelivery, catStaffConduct];
  for (const cat of categoriesList) {
    await prisma.slaRule.createMany({
      data: [
        { categoryId: cat.id, priority: 'CRITICAL', resolutionTimeHours: 4, escalateAfterHours: 2 },
        { categoryId: cat.id, priority: 'HIGH', resolutionTimeHours: 12, escalateAfterHours: 6 },
        { categoryId: cat.id, priority: 'MEDIUM', resolutionTimeHours: 24, escalateAfterHours: 12 },
        { categoryId: cat.id, priority: 'LOW', resolutionTimeHours: 48, escalateAfterHours: 24 },
      ]
    });
  }

  console.log('✅ Configured SLA rules for all categories');

  // 4. Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Sarah Vance (Chief Admin)',
      email: 'admin@resolvai.gov',
      passwordHash,
      role: 'ADMIN',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      name: 'David Chen (Dept Head)',
      email: 'manager@resolvai.gov',
      passwordHash,
      role: 'MANAGER',
      departmentId: deptTech.id,
      phone: '+1 (555) 019-5432',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    }
  });

  const agentTech = await prisma.user.create({
    data: {
      name: 'Alex Rivera (IT Specialist)',
      email: 'agent.tech@resolvai.gov',
      passwordHash,
      role: 'AGENT',
      departmentId: deptTech.id,
      phone: '+1 (555) 019-8765',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  });

  const agentBilling = await prisma.user.create({
    data: {
      name: 'Elena Rostova (Finance Lead)',
      email: 'agent.billing@resolvai.gov',
      passwordHash,
      role: 'AGENT',
      departmentId: deptBilling.id,
      phone: '+1 (555) 019-4321',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  });

  const agentWorks = await prisma.user.create({
    data: {
      name: 'Marcus Sterling (Civic Engineer)',
      email: 'agent.works@resolvai.gov',
      passwordHash,
      role: 'AGENT',
      departmentId: deptWorks.id,
      phone: '+1 (555) 019-9988',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    }
  });

  const citizenJohn = await prisma.user.create({
    data: {
      name: 'John Citizen',
      email: 'citizen.john@gmail.com',
      passwordHash,
      role: 'CITIZEN',
      phone: '+1 (555) 012-3456',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    }
  });

  const citizenMaya = await prisma.user.create({
    data: {
      name: 'Maya Patel',
      email: 'citizen.maya@gmail.com',
      passwordHash,
      role: 'CITIZEN',
      phone: '+1 (555) 014-9876',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    }
  });

  console.log('✅ Created users: Admin, Manager, 3 Agents, 2 Citizens');

  // 5. Knowledge Base FAQs
  await prisma.faqItem.createMany({
    data: [
      {
        question: 'How do I submit a new complaint or service request?',
        answer: 'You can submit a complaint in two easy ways: Click the "New Complaint" button on your dashboard to use our structured form, or simply chat with our 24/7 AI Chatbot in the bottom-right corner. Provide clear details, location, and upload supporting photos or documents.',
        category: 'General',
        keywordsJson: JSON.stringify(['file', 'submit', 'create', 'new complaint', 'form', 'how to'])
      },
      {
        question: 'How is complaint priority determined?',
        answer: 'Our AI engine analyzes the sentiment, keywords, safety impact, and service tier of your request to automatically assign priority (Low, Medium, High, or Critical). You can also indicate your requested priority when filing.',
        category: 'Triage',
        keywordsJson: JSON.stringify(['priority', 'urgency', 'high', 'critical', 'sla', 'triage'])
      },
      {
        question: 'What are the expected resolution times (SLA)?',
        answer: 'Critical emergencies (such as water mains bursts or major outages) are addressed within 4 hours. High priority requests are targeted within 12 hours, Medium within 24 hours, and standard requests within 48 hours.',
        category: 'SLA',
        keywordsJson: JSON.stringify(['time', 'duration', 'sla', 'hours', 'turnaround', 'how long'])
      },
      {
        question: 'How can I check the live status of my complaint?',
        answer: 'Visit the "My Complaints" tab on your dashboard, or ask the AI Chatbot by typing "Check status of CMP-..." with your ticket number. You will also receive real-time notifications on any status change.',
        category: 'Tracking',
        keywordsJson: JSON.stringify(['status', 'track', 'progress', 'ticket number', 'check'])
      },
      {
        question: 'Can I speak or escalate to a human support agent?',
        answer: 'Yes! Whenever you are chatting with our AI bot, you can click "Talk to Human" or type "escalate to agent" to immediately hand off your session to an on-duty specialist.',
        category: 'Support',
        keywordsJson: JSON.stringify(['human', 'agent', 'support', 'escalate', 'representative', 'talk to person'])
      }
    ]
  });

  console.log('✅ Created Knowledge Base FAQs');

  // 6. Sample Complaints
  const sampleData = [
    {
      ticketNumber: 'CMP-2026-1001',
      userId: citizenJohn.id,
      title: 'Major water main burst flooding 5th Avenue and Oak Street',
      description: 'High pressure municipal water line ruptured early this morning. Water is spilling into basements and blocking pedestrian traffic. Immediate repair crew needed.',
      categoryId: catWater.id,
      departmentId: deptWorks.id,
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      location: '5th Ave & Oak St Intersection, Downtown',
      sentiment: 'NEGATIVE',
      sentimentScore: -0.78,
      urgencyScore: 0.95,
      assignedStaffId: agentWorks.id,
      slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      aiSummary: 'Critical burst water pipe causing street flooding and property risk. Priority: Urgent emergency dispatch.',
      aiSuggestedDraft: 'Our emergency civic engineering crew has been dispatched to shut off the isolation valve and begin immediate trenching. ETA is 25 minutes.'
    },
    {
      ticketNumber: 'CMP-2026-1002',
      userId: citizenMaya.id,
      title: 'Erroneous double billing on March invoice #INV-98214',
      description: 'I was charged twice on my credit card for the high-speed fiber plan ($89.99 x 2). The payment gateway showed a timeout error on the first attempt.',
      categoryId: catRefund.id,
      departmentId: deptBilling.id,
      priority: 'HIGH',
      status: 'RESOLVED',
      location: 'Online Billing Portal',
      sentiment: 'NEGATIVE',
      sentimentScore: -0.45,
      urgencyScore: 0.70,
      assignedStaffId: agentBilling.id,
      resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      aiSummary: 'Duplicate transaction charged due to checkout gateway timeout. Requires payment reversal of $89.99.',
      aiSuggestedDraft: 'We have verified the duplicate charge with our payment processor. A full refund of $89.99 has been initiated to your original payment method.'
    },
    {
      ticketNumber: 'CMP-2026-1003',
      userId: citizenJohn.id,
      title: 'Total fiber broadband outage in North Suburbs sector 4',
      description: 'Internet connection dropped at 10:15 AM today. Router shows blinking red PON light. Multiple neighbors on the same block are experiencing the same issue.',
      categoryId: catInternet.id,
      departmentId: deptTech.id,
      priority: 'HIGH',
      status: 'PENDING',
      location: 'North Suburbs, Sector 4, Elmwood St.',
      sentiment: 'NEGATIVE',
      sentimentScore: -0.62,
      urgencyScore: 0.85,
      assignedStaffId: agentTech.id,
      slaDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      aiSummary: 'Local fiber network cluster disruption impacting multiple subscribers. PON alarm triggered on OLT.',
      aiSuggestedDraft: 'Our optical network engineers have identified an upstream fiber optic line splice fault. Technicians are on-site splicing the cable.'
    },
    {
      ticketNumber: 'CMP-2026-1004',
      userId: citizenMaya.id,
      title: 'Dangerous deep pothole near City Elementary School crossing',
      description: 'There is a 10-inch deep pothole directly at the pedestrian crosswalk near the school gate. Parents and cyclists are swerving dangerously.',
      categoryId: catRoads.id,
      departmentId: deptWorks.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      location: 'Maple St. in front of City Elementary Gate 2',
      sentiment: 'NEGATIVE',
      sentimentScore: -0.55,
      urgencyScore: 0.80,
      assignedStaffId: agentWorks.id,
      slaDeadline: new Date(Date.now() + 14 * 60 * 60 * 1000),
      aiSummary: 'Severe road hazard adjacent to school zone posing safety hazard to children and cyclists.',
      aiSuggestedDraft: 'Traffic cones have been placed as an immediate safety perimeter. The quick-fill cold mix asphalt team is scheduled to pave the pothole today.'
    },
    {
      ticketNumber: 'CMP-2026-1005',
      userId: citizenJohn.id,
      title: 'Mobile app crashes immediately after biometric face scan',
      description: 'Whenever I try to authenticate via Face ID on iOS 18.2, the app closes abruptly without any error prompt.',
      categoryId: catAppGlitch.id,
      departmentId: deptTech.id,
      priority: 'MEDIUM',
      status: 'RESOLVED',
      location: 'Mobile App (iOS)',
      sentiment: 'NEUTRAL',
      sentimentScore: -0.15,
      urgencyScore: 0.45,
      assignedStaffId: agentTech.id,
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      aiSummary: 'Client-side crash during biometric Keychain authentication on recent iOS version.',
      aiSuggestedDraft: 'We released patch v2.4.1 fixing the iOS 18 biometric entitlement mismatch. Please update the app via the App Store to resolve.'
    }
  ];

  for (const item of sampleData) {
    const embedding = generateMockEmbedding(`${item.title} ${item.description} ${item.location || ''}`);
    const complaint = await prisma.complaint.create({
      data: {
        ...item,
        embeddingJson: JSON.stringify(embedding)
      }
    });

    // Add status history
    await prisma.statusHistory.create({
      data: {
        complaintId: complaint.id,
        oldStatus: 'NONE',
        newStatus: 'PENDING',
        changedById: item.userId,
        note: 'Complaint created and verified by AI automated triage engine.'
      }
    });

    if (item.status === 'IN_PROGRESS' || item.status === 'RESOLVED') {
      await prisma.statusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: 'PENDING',
          newStatus: 'IN_PROGRESS',
          changedById: item.assignedStaffId || adminUser.id,
          note: 'Assigned to specialist agent and investigative work initiated.'
        }
      });
    }

    if (item.status === 'RESOLVED') {
      await prisma.statusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: 'IN_PROGRESS',
          newStatus: 'RESOLVED',
          changedById: item.assignedStaffId || adminUser.id,
          note: 'Issue verified and permanent resolution delivered.'
        }
      });

      // Feedback for resolved ticket
      await prisma.feedback.create({
        data: {
          complaintId: complaint.id,
          rating: item.ticketNumber === 'CMP-2026-1002' ? 5 : 4,
          comment: item.ticketNumber === 'CMP-2026-1002'
            ? 'Incredible turnaround! The refund hit my account within 3 hours. Great customer care.'
            : 'App update worked smoothly. Thank you for fixing the biometric bug so quickly!'
        }
      });
    }

    // Attach sample image for water burst
    if (item.ticketNumber === 'CMP-2026-1001') {
      await prisma.complaintAttachment.create({
        data: {
          complaintId: complaint.id,
          fileName: 'burst_pipe_photo.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
          fileType: 'image/jpeg',
          fileSize: 450210
        }
      });
    }
  }

  // 7. Initial Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: citizenJohn.id,
        title: 'Emergency Crew Dispatched',
        message: 'Your report regarding the water main burst (CMP-2026-1001) has been escalated to Critical and assigned to Marcus Sterling.',
        type: 'STATUS_UPDATE',
        isRead: false
      },
      {
        userId: citizenMaya.id,
        title: 'Refund Processed Successfully',
        message: 'Your complaint CMP-2026-1002 has been marked as Resolved. Please take a moment to rate our service.',
        type: 'STATUS_UPDATE',
        isRead: true
      },
      {
        userId: agentWorks.id,
        title: 'High Priority Ticket Assigned',
        message: 'You have been assigned urgent ticket CMP-2026-1001: Major water main burst flooding 5th Ave.',
        type: 'ASSIGNMENT',
        isRead: false
      }
    ]
  });

  console.log('✅ Created complaints, status histories, feedbacks, and notifications');
  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
