CREATE TABLE "music_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"cover" text,
	"listen_url" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "music_history_started_idx" ON "music_history" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "music_history_ended_idx" ON "music_history" USING btree ("ended_at");--> statement-breakpoint
CREATE INDEX "music_history_artist_idx" ON "music_history" USING btree ("artist");