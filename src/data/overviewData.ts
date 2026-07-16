export type ActivityLevel = 'info' | 'warning' | 'error'

export interface ActivityEntry {
  id: string
  /** References a GraphNode id from dummyData.ts. */
  nodeId: string
  time: string
  level: ActivityLevel
  message: string
}

// Newest first, as a live feed would render it.
export const activityFeed: ActivityEntry[] = [
  { id: 'a1', nodeId: 'ingest-bloomberg', time: '2m ago', level: 'info', message: 'ingest_bloomberg.py — 48,203 ticks ingested' },
  { id: 'a2', nodeId: 'alerting-engine', time: '9m ago', level: 'warning', message: 'alerting_engine.py — risk threshold breached on EURUSD desk' },
  { id: 'a3', nodeId: 'risk-worker-2', time: '14m ago', level: 'info', message: 'risk_worker (shard 2) — VaR batch completed in 41s' },
  { id: 'a4', nodeId: 'news-sentiment', time: '26m ago', level: 'info', message: 'news_sentiment.py — 214 headlines scored' },
  { id: 'a5', nodeId: 'vendor-sync', time: '38m ago', level: 'error', message: 'vendor_sync.py — FTP connection timeout, retrying (3/5)' },
  { id: 'a6', nodeId: 'reconcile-positions', time: '52m ago', level: 'warning', message: 'reconcile_positions.py — 3 positions unmatched, flagged for review' },
  { id: 'a7', nodeId: 'risk-model', time: '1h ago', level: 'info', message: 'risk_model.py — hourly VaR computation completed' },
  { id: 'a8', nodeId: 'normalize-prices', time: '1h 12m ago', level: 'info', message: 'normalize_prices.py — 1.2M rows archived to S3' },
  { id: 'a9', nodeId: 'report-builder', time: '2h ago', level: 'info', message: 'report_builder.py — daily report assembled and distributed' },
  { id: 'a10', nodeId: 'vendor-sync', time: '3h ago', level: 'info', message: 'vendor_sync.py — nightly FTP drop parsed, 6,481 rows' },
]

// Relative hourly throughput (records processed, thousands) for the last 24h,
// oldest first — quiet overnight, ramping through the trading day.
export const throughputHistory: number[] = [
  12, 9, 8, 7, 6, 8, 15, 34, 52, 61, 58, 49, 55, 63, 59, 47, 38, 29, 21, 18, 22, 26, 19, 14,
]

export const systemStatus: { state: 'nominal' | 'degraded' | 'critical'; message: string; detail: string } = {
  state: 'nominal',
  message: 'System stable — nominal',
  detail: 'All scheduled pipelines running on time. No unresolved errors in the last hour.',
}
