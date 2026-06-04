-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "language" TEXT,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "referrer" TEXT,
    "landingPage" TEXT,
    "isNewVisitor" BOOLEAN NOT NULL DEFAULT true,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "firstVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_page_views" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT,
    "pageUrl" TEXT NOT NULL,
    "pageTitle" TEXT,
    "referrer" TEXT,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT,
    "eventType" TEXT NOT NULL,
    "elementId" TEXT,
    "elementClass" TEXT,
    "eventData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_daily_stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalVisitors" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visitors_sessionId_key" ON "visitors"("sessionId");

-- CreateIndex
CREATE INDEX "visitors_sessionId_idx" ON "visitors"("sessionId");

-- CreateIndex
CREATE INDEX "visitors_country_idx" ON "visitors"("country");

-- CreateIndex
CREATE INDEX "visitors_deviceType_idx" ON "visitors"("deviceType");

-- CreateIndex
CREATE INDEX "visitors_firstVisit_idx" ON "visitors"("firstVisit");

-- CreateIndex
CREATE INDEX "visitor_page_views_sessionId_idx" ON "visitor_page_views"("sessionId");

-- CreateIndex
CREATE INDEX "visitor_page_views_visitorId_idx" ON "visitor_page_views"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_page_views_createdAt_idx" ON "visitor_page_views"("createdAt");

-- CreateIndex
CREATE INDEX "visitor_page_views_pageUrl_idx" ON "visitor_page_views"("pageUrl");

-- CreateIndex
CREATE INDEX "visitor_events_sessionId_idx" ON "visitor_events"("sessionId");

-- CreateIndex
CREATE INDEX "visitor_events_visitorId_idx" ON "visitor_events"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_events_eventType_idx" ON "visitor_events"("eventType");

-- CreateIndex
CREATE INDEX "visitor_events_createdAt_idx" ON "visitor_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_daily_stats_date_key" ON "visitor_daily_stats"("date");

-- CreateIndex
CREATE INDEX "visitor_daily_stats_date_idx" ON "visitor_daily_stats"("date");

-- AddForeignKey
ALTER TABLE "visitor_page_views" ADD CONSTRAINT "visitor_page_views_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_events" ADD CONSTRAINT "visitor_events_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
