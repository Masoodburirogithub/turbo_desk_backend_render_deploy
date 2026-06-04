// backend/src/controllers/visitorController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all visitors with pagination and date range filter
const getAllVisitors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    let where = search ? {
      OR: [
        { country: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { browser: { contains: search, mode: 'insensitive' } },
        { deviceType: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    // Add date range filter
    if (startDate || endDate) {
      where.lastVisit = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.lastVisit.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.lastVisit.lte = end;
      }
    }
    
    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        include: {
          pageViews: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        },
        orderBy: { lastVisit: 'desc' },
        skip,
        take: limit
      }),
      prisma.visitor.count({ where })
    ]);
    
    res.json({
      success: true,
      data: visitors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get visitors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get visitor by ID
const getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: {
        pageViews: {
          orderBy: { createdAt: 'desc' }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });
    
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }
    
    res.json({ success: true, data: visitor });
  } catch (error) {
    console.error('Get visitor error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get visitor statistics for dashboard with date range - FIXED
const getVisitorStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse date range
    let startFilter = null;
    let endFilter = null;
    
    if (startDate) {
      startFilter = new Date(startDate);
      startFilter.setHours(0, 0, 0, 0);
    }
    if (endDate) {
      endFilter = new Date(endDate);
      endFilter.setHours(23, 59, 59, 999);
    }
    
    // Build WHERE clause properly
    let whereClause = '';
    let queryParams = [];
    
    if (startFilter && endFilter) {
      whereClause = 'WHERE "lastVisit" >= $1 AND "lastVisit" <= $2';
      queryParams = [startFilter, endFilter];
    } else if (startFilter) {
      whereClause = 'WHERE "lastVisit" >= $1';
      queryParams = [startFilter];
    } else if (endFilter) {
      whereClause = 'WHERE "lastVisit" <= $1';
      queryParams = [endFilter];
    }
    
    // Build WHERE clause for additional filters (with proper AND handling)
    const getWhereWithExtra = (extraCondition) => {
      if (whereClause) {
        return `${whereClause} AND ${extraCondition}`;
      } else {
        return `WHERE ${extraCondition}`;
      }
    };
    
    // Total visitors
    let totalQuery = `SELECT COUNT(DISTINCT "sessionId")::int as count FROM visitors ${whereClause}`;
    let totalResult;
    if (queryParams.length > 0) {
      totalResult = await prisma.$queryRawUnsafe(totalQuery, ...queryParams);
    } else {
      totalResult = await prisma.$queryRawUnsafe(totalQuery);
    }
    
    // Device stats - FIXED
    let deviceWhere = getWhereWithExtra('"deviceType" IS NOT NULL');
    let deviceQuery = `
      SELECT "deviceType", COUNT(DISTINCT "sessionId")::int as count
      FROM visitors 
      ${deviceWhere}
      GROUP BY "deviceType"
    `;
    let deviceStats;
    if (queryParams.length > 0) {
      deviceStats = await prisma.$queryRawUnsafe(deviceQuery, ...queryParams);
    } else {
      deviceStats = await prisma.$queryRawUnsafe(deviceQuery);
    }
    
    // Browser stats - FIXED
    let browserWhere = getWhereWithExtra('browser IS NOT NULL AND browser != \'Unknown\'');
    let browserQuery = `
      SELECT browser, COUNT(DISTINCT "sessionId")::int as count
      FROM visitors 
      ${browserWhere}
      GROUP BY browser
      ORDER BY count DESC
    `;
    let browserStats;
    if (queryParams.length > 0) {
      browserStats = await prisma.$queryRawUnsafe(browserQuery, ...queryParams);
    } else {
      browserStats = await prisma.$queryRawUnsafe(browserQuery);
    }
    
    // Daily stats
    let dailyStats = [];
    
    if (startFilter && endFilter) {
      const dayCount = Math.min(30, Math.ceil((endFilter - startFilter) / (1000 * 60 * 60 * 24)));
      
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(startFilter);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const [dayResult] = await prisma.$queryRaw`
          SELECT COUNT(DISTINCT "sessionId")::int as count
          FROM visitors 
          WHERE "lastVisit" >= ${date} AND "lastVisit" < ${nextDate}
        `;
        
        dailyStats.push({
          date: date.toLocaleDateString(),
          views: Number(dayResult.count)
        });
      }
    } else {
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const [dayResult] = await prisma.$queryRaw`
          SELECT COUNT(DISTINCT "sessionId")::int as count
          FROM visitors 
          WHERE "lastVisit" >= ${date} AND "lastVisit" < ${nextDate}
        `;
        
        dailyStats.push({
          date: date.toLocaleDateString(),
          views: Number(dayResult.count)
        });
      }
    }
    
    const avgDaily = dailyStats.length > 0 
      ? Math.round(dailyStats.reduce((sum, day) => sum + day.views, 0) / dailyStats.length)
      : 0;
    
    const formattedDeviceStats = deviceStats.map(stat => ({
      deviceType: stat.deviceType,
      _count: Number(stat.count)
    }));
    
    const formattedBrowserStats = browserStats.map(stat => ({
      browser: stat.browser,
      _count: Number(stat.count)
    }));
    
    res.json({
      success: true,
      data: {
        total: Number(totalResult[0]?.count || 0),
        today: 0,
        week: 0,
        month: 0,
        unique: Number(totalResult[0]?.count || 0),
        avgDaily: avgDaily,
        devices: formattedDeviceStats,
        browsers: formattedBrowserStats,
        dailyViews: dailyStats
      }
    });
  } catch (error) {
    console.error('Get visitor stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get page views analytics
const getPageViewsAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    
    const pageViews = await prisma.$queryRaw`
      SELECT "pageUrl", COUNT(DISTINCT "sessionId")::int as unique_visitors, COUNT(*)::int as total_views
      FROM visitor_page_views 
      WHERE "createdAt" >= ${since}
      GROUP BY "pageUrl"
      ORDER BY total_views DESC
      LIMIT 20
    `;
    
    res.json({ success: true, data: pageViews });
  } catch (error) {
    console.error('Get page views error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export visitor data as CSV with date filter
const exportVisitorsCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let where = {};
    
    if (startDate || endDate) {
      where.lastVisit = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.lastVisit.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.lastVisit.lte = end;
      }
    }
    
    const visitors = await prisma.visitor.findMany({
      where,
      orderBy: { firstVisit: 'desc' }
    });
    
    const headers = ['Session ID', 'Country', 'City', 'Device', 'Browser', 'OS', 'First Visit', 'Last Visit', 'Visits', 'Time Spent (min)'];
    const rows = visitors.map(v => [
      v.sessionId,
      v.country || '',
      v.city || '',
      v.deviceType || '',
      v.browser || '',
      v.os || '',
      v.firstVisit.toISOString(),
      v.lastVisit.toISOString(),
      v.visitCount,
      Math.round(v.totalTimeSpent / 60)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=visitors_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllVisitors,
  getVisitorById,
  getVisitorStats,
  getPageViewsAnalytics,
  exportVisitorsCSV
};