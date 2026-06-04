// backend/src/middleware/visitorTracking.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// File extensions to skip tracking (static assets)
const STATIC_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', 
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
  '.css', '.scss', '.sass',
  '.js', '.ts', '.jsx', '.tsx', '.map',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.json', '.xml', '.txt', '.pdf', '.doc', '.docx'
];

// Check if URL is a static asset (should not be tracked)
// Check if URL is a static asset (should not be tracked)
const isStaticAsset = (url) => {
  if (!url) return true;
  const lowercaseUrl = url.toLowerCase();
  
  // Skip ALL API calls
  if (lowercaseUrl.includes('/api/')) return true;
  
  // Skip ALL uploads (anything in /uploads/ folder)
  if (lowercaseUrl.includes('/uploads/')) {
    // console.log(`Skipping upload: ${url}`);
    return true;
  }
  
  // Skip common static file patterns
  const staticPatterns = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
    '.mp4', '.webm', '.mov', '.avi', '.mkv',
    '.css', '.scss', '.sass',
    '.js', '.ts', '.jsx', '.tsx', '.map',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.json', '.xml', '.txt', '.pdf'
  ];
  
  // Check if URL contains any static pattern (not just ends with)
  const isStatic = staticPatterns.some(pattern => lowercaseUrl.includes(pattern));
  
  if (isStatic) {
    // console.log(`Skipping static file: ${url}`);
  }
  
  return isStatic;
};

// Get geolocation from IP
const getGeoLocation = async (ip) => {
  try {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null;
    }
    
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country,
        city: data.city,
        region: data.regionName,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  
  let deviceType = 'desktop';
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let osVersion = 'Unknown';
  
  // Detect device type
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/(Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini))/i.test(ua)) {
    deviceType = 'mobile';
  }
  
  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  }
  
  // Detect OS
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return { deviceType, browser, browserVersion, os, osVersion };
};

// Track visitor - MAIN FUNCTION (UPDATED to skip static assets)
const trackVisitor = async (req, res, next) => {
  try {
    const currentPage = req.originalUrl || req.url;
    
    // CRITICAL: Skip tracking for static assets and uploads
    if (isStaticAsset(currentPage)) {
      return next();
    }
    
    // Skip admin API routes
    if (currentPage.includes('/admin') && currentPage.includes('/api/')) {
      return next();
    }
    
    // Get or create session
    let sessionId = req.cookies?.visitorSessionId;
    
    if (!sessionId) {
      sessionId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    const ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const cleanIp = ipAddress === '::1' ? '127.0.0.1' : ipAddress?.replace(/^::ffff:/, '');
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || req.headers.referrer;
    
    const { deviceType, browser, browserVersion, os, osVersion } = parseUserAgent(userAgent);
    const geoData = await getGeoLocation(cleanIp);
    
    const now = new Date();
    
    // Find or create visitor
    let visitor = await prisma.visitor.findUnique({
      where: { sessionId }
    });
    
    if (visitor) {
      // Update existing visitor
      const timeDiff = Math.floor((now - visitor.lastVisit) / 1000);
      
      visitor = await prisma.visitor.update({
        where: { sessionId },
        data: {
          visitCount: { increment: 1 },
          lastVisit: now,
          totalTimeSpent: { increment: Math.min(timeDiff, 1800) },
          ipAddress: cleanIp || visitor.ipAddress,
          userAgent: userAgent || visitor.userAgent,
          deviceType: deviceType || visitor.deviceType,
          browser: browser || visitor.browser,
          os: os || visitor.os,
          country: geoData?.country || visitor.country,
          city: geoData?.city || visitor.city,
        }
      });
    } else {
      // Create new visitor
      visitor = await prisma.visitor.create({
        data: {
          sessionId,
          ipAddress: cleanIp,
          userAgent,
          deviceType,
          browser,
          browserVersion,
          os,
          osVersion,
          referrer,
          landingPage: currentPage,
          isNewVisitor: true,
          visitCount: 1,
          firstVisit: now,
          lastVisit: now,
          country: geoData?.country,
          city: geoData?.city,
          region: geoData?.region,
        }
      });
    }
    
    // Only track page views for actual HTML pages (not static files)
    // Static files are already filtered by isStaticAsset()
    await prisma.visitorPageView.create({
      data: {
        sessionId,
        visitorId: visitor.id,
        pageUrl: currentPage,
        referrer,
        createdAt: now
      }
    });
    
    // Set cookie
    res.cookie('visitorSessionId', sessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    req.visitor = visitor;
    req.visitorSessionId = sessionId;
    
    next();
  } catch (error) {
    console.error('Visitor tracking error:', error);
    next();
  }
};

// Track page view duration
const trackPageViewDuration = async (req, res) => {
  try {
    const { pageViewId, timeSpent } = req.body;
    
    if (pageViewId && timeSpent) {
      await prisma.visitorPageView.update({
        where: { id: pageViewId },
        data: { timeSpent: Math.min(timeSpent, 3600) }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Track visitor event
const trackEvent = async (req, res) => {
  try {
    const { sessionId, eventType, elementId, elementClass, eventData } = req.body;
    
    const visitor = await prisma.visitor.findUnique({
      where: { sessionId }
    });
    
    if (visitor) {
      await prisma.visitorEvent.create({
        data: {
          sessionId,
          visitorId: visitor.id,
          eventType,
          elementId,
          elementClass,
          eventData
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get or create session
const getSession = async (req, res) => {
  try {
    let sessionId = req.cookies?.visitorSessionId;
    
    if (!sessionId) {
      sessionId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      await prisma.visitor.create({
        data: {
          sessionId,
          isNewVisitor: true,
          visitCount: 1,
          firstVisit: new Date(),
          lastVisit: new Date()
        }
      });
      
      res.cookie('visitorSessionId', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      });
    }
    
    res.json({ success: true, sessionId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  trackVisitor,
  trackPageViewDuration,
  trackEvent,
  getSession
};