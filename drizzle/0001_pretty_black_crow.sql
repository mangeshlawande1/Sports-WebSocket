CREATE INDEX "commentary_match_id_idx" ON "commentary" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_sequence_unique" UNIQUE("match_id","sequence");