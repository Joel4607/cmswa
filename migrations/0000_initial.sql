CREATE TABLE IF NOT EXISTS sheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL,
  year TEXT NOT NULL,
  file TEXT NOT NULL,
  sheet TEXT NOT NULL,
  headers TEXT NOT NULL,
  rows TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sheets_unique
  ON sheets(module, year, file, sheet);

CREATE INDEX IF NOT EXISTS idx_sheets_module_year
  ON sheets(module, year);
