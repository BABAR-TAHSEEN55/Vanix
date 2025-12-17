ALTER TABLE "messages" ADD COLUMN "currentViews" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "maxViews" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "expiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "createdAt" timestamp DEFAULT now();