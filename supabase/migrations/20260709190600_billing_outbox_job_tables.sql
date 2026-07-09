-- Stage 2A1: outbox and job execution indexes (draft)
CREATE INDEX IF NOT EXISTS idx_job_executions_status_started
  ON billing.job_executions (status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_type_started
  ON billing.reconciliation_runs (run_type, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_dead_letter_events_status_failed
  ON billing.dead_letter_events (status, failed_at DESC);

CREATE INDEX IF NOT EXISTS idx_outbox_events_dispatch
  ON billing.outbox_events (status, next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');
