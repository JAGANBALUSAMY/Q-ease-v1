
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to determine the scope
const resolveScope = (req) => {
  const paramOrgId = req.params.organisationId;
  const userOrgId = req.user.organisationId;
  const userId = req.user.id;
  // Standardize the role comparison
  const role = req.user.role ? req.user.role.toUpperCase() : '';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOrgAdmin = role === 'ORGANISATION_ADMIN';

  // 1. Super Admin without specific Org override (Global View)
  if (isSuperAdmin && !paramOrgId) {
    return { organisationId: null, isGlobal: true, adminId: null, isOrgAdmin: false };
  }

  // 2. Explicit Organisation ID in URL
  if (paramOrgId) {
    return { organisationId: paramOrgId, isGlobal: false, adminId: null, isOrgAdmin: false };
  }

  // 3. User's Organisation ID (Standard Org Admin/Staff)
  if (userOrgId) {
    return {
      organisationId: userOrgId,
      isGlobal: false,
      adminId: isOrgAdmin ? userId : null,
      isOrgAdmin
    };
  }

  // 4. Fallback
  return {
    organisationId: null,
    isGlobal: isSuperAdmin,
    adminId: null,
    isOrgAdmin: false,
    error: !isSuperAdmin && !userOrgId
  };
};

const getAdminStats = async (req, res) => {
  try {
    const { organisationId, isGlobal, adminId, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: { totalUsers: 0, totalQueues: 0, activeTokens: 0, staffCount: 0, customerCount: 0, adminCount: 0 } });

    const userWhere = isGlobal ? {} : { organisationId };
    const queueWhere = {
      ...(isGlobal ? {} : { organisationId }),
      ...(adminId ? { adminId } : {})
    };
    const tokenWhere = {
      status: { in: ['PENDING', 'CALLED'] },
      queue: queueWhere
    };

    // Get user counts by role
    const [
      usersCount,
      queuesCount,
      activeTokens,
      staffCount,
      customerCount,
      adminCount,
      completedTokensToday
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.queue.count({ where: queueWhere }),
      prisma.token.count({ where: tokenWhere }),
      // Count staff users
      prisma.user.count({
        where: {
          ...userWhere,
          roleModel: { name: 'STAFF' }
        }
      }),
      // Count customer/user users
      prisma.user.count({
        where: {
          ...userWhere,
          roleModel: { name: 'USER' }
        }
      }),
      // Count admin users (ADMIN + ORGANISATION_ADMIN)
      prisma.user.count({
        where: {
          ...userWhere,
          roleModel: { name: { in: ['ADMIN', 'ORGANISATION_ADMIN'] } }
        }
      }),
      // Get completed tokens from today for average wait time calculation
      prisma.token.findMany({
        where: {
          status: 'SERVED',
          servedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
          },
          queue: queueWhere
        },
        select: {
          createdAt: true,
          calledAt: true
        }
      })
    ]);

    // Calculate average wait time from completed tokens
    let avgWaitTime = 0;
    if (completedTokensToday.length > 0) {
      const totalWaitTime = completedTokensToday.reduce((sum, token) => {
        if (token.calledAt && token.createdAt) {
          const waitMinutes = Math.floor((new Date(token.calledAt) - new Date(token.createdAt)) / (1000 * 60));
          return sum + waitMinutes;
        }
        return sum;
      }, 0);
      avgWaitTime = Math.round(totalWaitTime / completedTokensToday.length);
    }

    res.json({
      success: true,
      data: {
        totalUsers: usersCount,
        totalQueues: queuesCount,
        activeTokens,
        staffCount,
        customerCount,
        adminCount,
        todayServed: completedTokensToday.length,
        avgWaitTime
      }
    });
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const { organisationId, isGlobal, adminId, error } = resolveScope(req);

    if (error) return res.json({ success: true, data: { activities: [] } });

    const queueWhere = {
      ...(isGlobal ? {} : { organisationId }),
      ...(adminId ? { adminId } : {})
    };

    const whereClause = { queue: queueWhere };

    const [recentTokens, recentQueues] = await Promise.all([
      prisma.token.findMany({
        where: whereClause,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { tokenUser: true, queue: true }
      }),
      prisma.queue.findMany({
        where: queueWhere,
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const tokenActivities = recentTokens.map(t => ({
      id: `token-${t.id}`,
      type: 'TOKEN_CREATED',
      description: `Token ${t.tokenId} created in ${t.queue?.name || 'Unknown Queue'}`,
      timestamp: t.createdAt
    }));

    const queueActivities = recentQueues.map(q => ({
      id: `queue-${q.id}`,
      type: 'QUEUE_CREATED',
      description: `New Queue "${q.name}" created`,
      timestamp: q.createdAt
    }));

    const allActivities = [...tokenActivities, ...queueActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .map(a => ({
        ...a,
        timestamp: new Date(a.timestamp).toLocaleString()
      }));

    res.json({
      success: true,
      data: {
        activities: allActivities
      }
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};

const getOverview = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: {} });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tokenFilter = {
      status: 'SERVED',
      servedAt: { gte: today },
      ...(isGlobal ? {} : { queue: { organisationId } })
    };

    const feedbackFilter = {
      createdAt: { gte: today },
      ...(isGlobal ? {} : { queue: { organisationId } })
    };

    const queueFilter = {
      isActive: true,
      ...(isGlobal ? {} : { organisationId })
    };

    const [totalServedToday, avgWaitTime, satisfactionScore, activeQueues] = await Promise.all([
      prisma.token.count({ where: tokenFilter }),

      prisma.token.findMany({
        where: tokenFilter,
        select: { calledAt: true, servedAt: true }
      }).then(tokens => {
        if (tokens.length === 0) return 0;
        const totalWaitTime = tokens.reduce((sum, token) =>
          sum + (token.servedAt - token.calledAt) / 60000, 0);
        return Math.round(totalWaitTime / tokens.length);
      }),

      prisma.feedback.findMany({
        where: feedbackFilter,
        select: { rating: true }
      }).then(feedbacks => {
        if (feedbacks.length === 0) return 0;
        const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
        return Math.round((totalRating / feedbacks.length) * 10) / 10;
      }),

      prisma.queue.count({ where: queueFilter })
    ]);

    res.json({
      success: true,
      data: { totalServedToday, avgWaitTime, satisfactionScore, activeQueues }
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overview analytics' });
  }
};

const getRealtimeOverview = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: {} });

    const queueFilter = { isActive: true, ...(isGlobal ? {} : { organisationId }) };
    const tokenFilter = { queue: { isActive: true, ...(isGlobal ? {} : { organisationId }) } };
    const staffFilter = { role: 'STAFF', isActive: true, ...(isGlobal ? {} : { organisationId }) };

    const [activeQueues, waitingCustomers, servedToday, staffOnline] = await Promise.all([
      prisma.queue.count({ where: queueFilter }),

      prisma.token.count({
        where: {
          status: 'WAITING',
          ...tokenFilter
        }
      }),

      prisma.token.count({
        where: {
          status: 'SERVED',
          servedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          ...tokenFilter
        }
      }),

      prisma.user.count({ where: staffFilter })
    ]);

    res.json({
      success: true,
      data: { activeQueues, waitingCustomers, servedToday, staffOnline }
    });
  } catch (error) {
    console.error('Error fetching realtime overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch realtime overview' });
  }
};

const getRealtimeQueues = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: [] });

    const queueFilter = { isActive: true, ...(isGlobal ? {} : { organisationId }) };

    const queues = await prisma.queue.findMany({
      where: queueFilter,
      include: {
        tokens: {
          where: { status: 'WAITING' },
          select: { id: true }
        },
        staffAssignments: {
          where: { staff: { isActive: true } },
          select: { staff: true }
        }
      }
    });

    const queueData = queues.map(queue => ({
      name: queue.name,
      waiting: queue.tokens.length,
      avgWait: Math.round(queue.averageTime || 10),
      status: queue.isActive ? 'active' : 'paused',
      staffCount: queue.staffAssignments.length
    }));

    res.json({ success: true, data: queueData });
  } catch (error) {
    console.error('Error fetching realtime queues:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch realtime queues' });
  }
};

const getRealtimeAlerts = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: [] });

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const alerts = [];

    const queueFilter = { isActive: true, ...(isGlobal ? {} : { organisationId }) };

    // Check for long wait times
    const longWaitTokens = await prisma.token.count({
      where: {
        status: 'WAITING',
        issuedAt: { lt: oneHourAgo },
        queue: { ...(isGlobal ? {} : { organisationId }) }
      }
    });

    if (longWaitTokens > 5) {
      alerts.push({
        severity: 'high',
        message: `${longWaitTokens} customers waiting over 1 hour`,
        time: now.toLocaleTimeString()
      });
    }

    // Check for queue capacity
    const overloadedQueues = await prisma.queue.findMany({
      where: {
        ...queueFilter,
        tokens: { some: { status: 'WAITING' } }
      },
      include: {
        tokens: { where: { status: 'WAITING' } }
      }
    });

    overloadedQueues.forEach(queue => {
      if (queue.tokens.length > (queue.maxTokens || 50)) {
        alerts.push({
          severity: 'medium',
          message: `${queue.name} queue over capacity (${queue.tokens.length})`,
          time: now.toLocaleTimeString()
        });
      }
    });

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching realtime alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch realtime alerts' });
  }
};

const getHistoricalPerformance = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: [] });

    const { range = '7d' } = req.query;
    const days = parseInt(range.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performanceData = await prisma.token.findMany({
      where: {
        status: 'SERVED',
        servedAt: { gte: startDate },
        ...(isGlobal ? {} : { queue: { organisationId } })
      },
      select: { servedAt: true, calledAt: true, queueId: true }
    });

    const dailyStats = {};
    performanceData.forEach(token => {
      const date = token.servedAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { served: 0, totalWaitTime: 0, queues: new Set() };
      }
      dailyStats[date].served++;
      dailyStats[date].totalWaitTime += (token.servedAt - token.calledAt) / 60000;
      dailyStats[date].queues.add(token.queueId);
    });

    const formattedData = Object.keys(dailyStats).map(date => ({
      date,
      served: dailyStats[date].served,
      avgWaitTime: Math.round(dailyStats[date].totalWaitTime / dailyStats[date].served),
      queuesActive: dailyStats[date].queues.size
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching historical performance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch historical performance' });
  }
};

const getStaffPerformance = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: [] });

    const queueFilter = { isActive: true, ...(isGlobal ? {} : { organisationId }) };

    const staffPerformance = await prisma.staffAssignment.findMany({
      where: { queue: queueFilter },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true } },
        queue: { select: { name: true } },
        tokens: {
          where: { status: 'SERVED' },
          select: { id: true, issuedAt: true, calledAt: true, servedAt: true }
        }
      }
    });

    const performanceData = staffPerformance.map(assignment => {
      const tokens = assignment.tokens;
      const avgWaitTime = tokens.length > 0
        ? Math.round(tokens.reduce((sum, token) => sum + (token.servedAt - token.calledAt) / 60000, 0) / tokens.length)
        : 0;

      return {
        staffName: `${assignment.staff.firstName} ${assignment.staff.lastName}`,
        queue: assignment.queue.name,
        tokensServed: tokens.length,
        avgWaitTime,
        efficiency: tokens.length > 0 ? Math.min(100, Math.round((60 / avgWaitTime) * 100)) : 0
      };
    });

    performanceData.sort((a, b) => b.efficiency - a.efficiency);
    res.json({ success: true, data: performanceData });
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff performance' });
  }
};

const getCustomerSatisfaction = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: { avgRating: 0, totalFeedback: 0, ratingDistribution: {} } });

    const feedbackFilter = {
      createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
      ...(isGlobal ? {} : { queue: { organisationId } })
    };

    const satisfactionData = await prisma.feedback.findMany({
      where: feedbackFilter,
      select: { rating: true, createdAt: true, queueId: true }
    });

    const avgRating = satisfactionData.length > 0
      ? Math.round((satisfactionData.reduce((sum, fb) => sum + fb.rating, 0) / satisfactionData.length) * 10) / 10
      : 0;

    const ratingDistribution = {
      '5': satisfactionData.filter(fb => fb.rating === 5).length,
      '4': satisfactionData.filter(fb => fb.rating === 4).length,
      '3': satisfactionData.filter(fb => fb.rating === 3).length,
      '2': satisfactionData.filter(fb => fb.rating === 2).length,
      '1': satisfactionData.filter(fb => fb.rating === 1).length
    };

    res.json({ success: true, data: { avgRating, totalFeedback: satisfactionData.length, ratingDistribution } });
  } catch (error) {
    console.error('Error fetching customer satisfaction:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer satisfaction' });
  }
};

const getOperationalEfficiency = async (req, res) => {
  try {
    const { organisationId, isGlobal, error } = resolveScope(req);
    if (error) return res.json({ success: true, data: {} });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tokenFilter = {
      ...(isGlobal ? {} : { queue: { organisationId } })
    };

    // Note: Staff count is approximated by filter. 
    // Ideally, we should check StaffAssignment, but filtering by User.role=STAFF+Org works.
    const staffFilter = { role: 'STAFF', isActive: true, ...(isGlobal ? {} : { organisationId }) };

    const [totalTokens, servedTokens, staffCount, avgServiceTime] = await Promise.all([
      prisma.token.count({
        where: {
          issuedAt: { gte: today },
          ...tokenFilter
        }
      }),

      prisma.token.count({
        where: {
          status: 'SERVED',
          servedAt: { gte: today },
          ...tokenFilter
        }
      }),

      prisma.user.count({ where: staffFilter }),

      prisma.token.findMany({
        where: {
          status: 'SERVED',
          servedAt: { gte: today },
          ...tokenFilter
        },
        select: { calledAt: true, servedAt: true }
      }).then(tokens => {
        if (tokens.length === 0) return 0;
        const totalTime = tokens.reduce((sum, token) =>
          sum + (token.servedAt - token.calledAt) / 60000, 0);
        return Math.round(totalTime / tokens.length);
      })
    ]);

    const efficiency = totalTokens > 0
      ? Math.round((servedTokens / totalTokens) * 100)
      : 0;

    const resourceUtilization = staffCount > 0
      ? Math.min(100, Math.round((servedTokens / staffCount / 8) * 100))
      : 0;

    res.json({
      success: true,
      data: { efficiency, resourceUtilization, avgServiceTime, servedTokens, totalTokens, staffCount }
    });
  } catch (error) {
    console.error('Error fetching operational efficiency:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch operational efficiency' });
  }
};

const exportAnalytics = async (req, res) => {
  try {
    const { format = 'csv', tab, range } = req.query;
    const exportData = { timestamp: new Date().toISOString(), tab, range, format };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${tab}-${range}.csv`);
      res.send('Date,Value\n2024-01-01,100\n2024-01-02,150');
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${tab}-${range}.pdf`);
      res.send('PDF content would be generated here');
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to export analytics' });
  }
};

// Get staff stats for staff dashboard
const getStaffStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const organisationId = req.user.organisationId;

    if (!organisationId) {
      return res.json({
        success: true,
        stats: {
          totalServed: 0,
          totalWaiting: 0,
          avgWaitTime: 0
        }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tokens served today in this organization
    const servedToday = await prisma.token.count({
      where: {
        status: 'SERVED',
        servedAt: { gte: today },
        organisationId
      }
    });

    // Get currently waiting tokens in this organization
    const waitingCount = await prisma.token.count({
      where: {
        status: { in: ['PENDING', 'CALLED'] },
        organisationId
      }
    });

    // Calculate average wait time for served tokens today
    const servedTokens = await prisma.token.findMany({
      where: {
        status: 'SERVED',
        servedAt: { gte: today },
        organisationId
      },
      select: {
        issuedAt: true,
        servedAt: true
      }
    });

    let avgWaitTime = 0;
    if (servedTokens.length > 0) {
      const totalWaitTime = servedTokens.reduce((sum, token) => {
        const waitMinutes = (token.servedAt - token.issuedAt) / 60000;
        return sum + waitMinutes;
      }, 0);
      avgWaitTime = Math.round(totalWaitTime / servedTokens.length);
    }

    res.json({
      success: true,
      stats: {
        totalServed: servedToday,
        totalWaiting: waitingCount,
        avgWaitTime
      }
    });
  } catch (error) {
    console.error('Staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff stats'
    });
  }
};

module.exports = {
  getOverview,
  getRealtimeOverview,
  getRealtimeQueues,
  getRealtimeAlerts,
  getHistoricalPerformance,
  getStaffPerformance,
  getCustomerSatisfaction,
  getOperationalEfficiency,
  exportAnalytics,
  getAdminStats,
  getRecentActivity,
  getStaffStats
};