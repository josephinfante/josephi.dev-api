CREATE TABLE "steam_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" text NOT NULL,
	"name" text NOT NULL,
	"icon_url" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "steam_history_started_idx" ON "steam_history" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "steam_history_ended_idx" ON "steam_history" USING btree ("ended_at");--> statement-breakpoint
CREATE INDEX "steam_history_app_idx" ON "steam_history" USING btree ("app_id");