-- D1 schema for the chatbot: keyword-search source of truth + observability traces.
-- Apply with:  npx wrangler d1 execute ashim-chatbot --file=./schema.sql --remote

-- Knowledge chunks (source of truth for BM25 keyword search).
CREATE TABLE IF NOT EXISTS chunks (
  id    TEXT PRIMARY KEY,
  title TEXT,
  url   TEXT,
  type  TEXT,
  text  TEXT
);

-- FTS5 index over title+text, kept in sync with `chunks` via triggers.
-- external-content table => the index stores no copy of the data itself.
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts
  USING fts5(title, text, content='chunks', content_rowid='rowid');

CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, title, text) VALUES (new.rowid, new.title, new.text);
END;
CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, title, text) VALUES('delete', old.rowid, old.title, old.text);
END;
CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, title, text) VALUES('delete', old.rowid, old.title, old.text);
  INSERT INTO chunks_fts(rowid, title, text) VALUES (new.rowid, new.title, new.text);
END;

-- One row per /chat request for the /ops dashboard.
CREATE TABLE IF NOT EXISTS traces (
  id            TEXT PRIMARY KEY,
  ts            INTEGER,
  question      TEXT,
  used_search   INTEGER,
  candidates    INTEGER,
  used          INTEGER,
  retrieve_ms   INTEGER,
  total_ms      INTEGER,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  cost_usd      REAL,
  model         TEXT
);
CREATE INDEX IF NOT EXISTS traces_ts ON traces (ts DESC);
