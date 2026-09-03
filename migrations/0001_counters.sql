-- The "signatures served" tally shown on the homepage. One row per counter.
--
-- The Worker creates this table itself the first time it needs it, so applying
-- this migration is optional; it is here for anyone who prefers to set the
-- schema up explicitly:
--
--   npx wrangler d1 migrations apply signaas
CREATE TABLE IF NOT EXISTS counters (
  name  TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
