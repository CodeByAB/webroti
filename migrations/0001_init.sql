-- Migration number: 0001 — meetings and votes.
--
-- A vote is stored as an integer number of tenths (1.0 → 10, 4.7 → 47) so
-- that averages are computed without floating point drift. See lib/meetings.js.

CREATE TABLE meetings (
  id TEXT PRIMARY KEY,                 -- six-digit code, e.g. '482913'
  created_at INTEGER NOT NULL,         -- epoch milliseconds
  last_activity_at INTEGER NOT NULL    -- epoch milliseconds, drives retention
);

CREATE INDEX meetings_last_activity_at ON meetings (last_activity_at);

CREATE TABLE votes (
  id INTEGER PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings (id) ON DELETE CASCADE,
  value_tenths INTEGER NOT NULL CHECK (value_tenths BETWEEN 10 AND 50),
  created_at INTEGER NOT NULL
);

CREATE INDEX votes_meeting_id ON votes (meeting_id);
