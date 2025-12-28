-- CreateTable
CREATE TABLE "analytics_events" (
    "id" SERIAL NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "eventData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" VARCHAR(100),
    "userAgent" TEXT,
    "ipHash" VARCHAR(64),

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_event_type" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "idx_timestamp" ON "analytics_events"("timestamp");

-- CreateIndex
CREATE INDEX "idx_session_id" ON "analytics_events"("sessionId");
