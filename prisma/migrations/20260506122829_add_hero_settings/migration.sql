-- CreateTable
CREATE TABLE "hero_settings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Ship Production-Ready Systems at AI Speed',
    "subtitle" TEXT NOT NULL DEFAULT 'We combine deep systems engineering with AI-native delivery to build scalable, secure applications in half the time. Zero technical debt. Full IP ownership.',
    "badgeText" TEXT NOT NULL DEFAULT 'Aurachron Systems Leading AI-Augmented Engineering Firm • 2026',
    "buttonText" TEXT NOT NULL DEFAULT 'Launch Your Project',
    "buttonLink" TEXT NOT NULL DEFAULT '/contact',
    "demoButtonText" TEXT NOT NULL DEFAULT 'Watch Demo',
    "videoUrl" TEXT DEFAULT '',
    "videoFile" TEXT DEFAULT '',
    "stats" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_settings_pkey" PRIMARY KEY ("id")
);
