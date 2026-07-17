import type { GraphNode, GraphEdge } from './types'

export const nodes: GraphNode[] = [
  { id: 'nucleus', type: 'nucleus', label: 'Eventide Analytics' },

  // --- Sources ---
  // `server` outranks `database` in the hierarchy (it's the host the
  // database runs on) despite both being plain `source` subtypes — the two
  // stay tightly coupled via the short 'hosts' edge below, not via type.
  { id: 'trading-db-server', type: 'source', subtype: 'server', label: 'db-prod-01', primaryAttribute: 'db-prod-01.internal', description: 'Bare-metal host running the trading database.' },
  { id: 'bloomberg', type: 'source', subtype: 'api', label: 'Bloomberg', primaryAttribute: 'https://api.bloomberg.com/v3/market-data', description: 'Real-time market data feed (equities, FX, rates).' },
  { id: 'internal-db', type: 'source', subtype: 'database', label: 'Trading DB', primaryAttribute: 'PostgreSQL 14', description: 'Internal OLTP database of trades and positions.' },
  { id: 's3-raw', type: 'source', subtype: 'object-storage', label: 'Raw Landing Zone', primaryAttribute: 's3://eventide-raw-landing', description: 'S3 bucket where unprocessed vendor files land.' },
  { id: 'news-scraper', type: 'source', subtype: 'scraper', label: 'News Scraper', primaryAttribute: 'reuters.com/markets, bloomberg.com/markets', description: 'Scrapes financial news sites for headlines.' },
  { id: 'vendor-ftp', type: 'source', subtype: 'ftp', label: 'Vendor FTP', primaryAttribute: 'ftp.vendor-data.com', description: 'Nightly FTP drop from a third-party data vendor.' },

  // --- Processes ---
  { id: 'ingest-bloomberg', type: 'process', subtype: 'cron-script', label: 'ingest_bloomberg.py', primaryAttribute: '*/5 * * * *', description: 'Pulls latest ticks from Bloomberg and lands raw JSON.' },
  { id: 'normalize-prices', type: 'process', subtype: 'child-script', label: 'normalize_prices.py', primaryAttribute: '/opt/pipelines/ingest/normalize_prices.py', description: 'Child of ingest_bloomberg.py — normalizes ticks into a common schema.' },
  { id: 'risk-model', type: 'process', subtype: 'cron-script', label: 'risk_model.py', primaryAttribute: '0 * * * *', description: 'Hourly VaR / risk metric computation.' },
  { id: 'risk-worker-1', type: 'process', subtype: 'child-script', label: 'risk_worker (shard 1)', primaryAttribute: '/opt/pipelines/risk/risk_worker.py --shard 1', description: 'Parallel worker spawned by risk_model.py for shard 1.' },
  { id: 'risk-worker-2', type: 'process', subtype: 'child-script', label: 'risk_worker (shard 2)', primaryAttribute: '/opt/pipelines/risk/risk_worker.py --shard 2', description: 'Parallel worker spawned by risk_model.py for shard 2.' },
  { id: 'news-sentiment', type: 'process', subtype: 'script', label: 'news_sentiment.py', primaryAttribute: '/opt/pipelines/news/news_sentiment.py', description: 'Scores scraped headlines for sentiment.' },
  { id: 'reconcile-positions', type: 'process', subtype: 'cron-script', label: 'reconcile_positions.py', primaryAttribute: '30 22 * * *', description: 'Nightly reconciliation of trading positions.' },
  { id: 'vendor-sync', type: 'process', subtype: 'cron-script', label: 'vendor_sync.py', primaryAttribute: '0 3 * * *', description: 'Pulls and parses the nightly vendor FTP drop.' },
  { id: 'report-builder', type: 'process', subtype: 'script', label: 'report_builder.py', primaryAttribute: '/opt/pipelines/reporting/report_builder.py', description: 'Assembles the daily report from risk and position data.' },
  { id: 'alerting-engine', type: 'process', subtype: 'script', label: 'alerting_engine.py', primaryAttribute: '/opt/pipelines/risk/alerting_engine.py', description: 'Evaluates thresholds across risk and sentiment signals.' },

  // --- Outputs ---
  { id: 'website-dashboard', type: 'output', subtype: 'website', label: 'Website Dashboard', primaryAttribute: 'https://dashboard.internal.eventide.com', description: 'Internal dashboard rendering live report data.' },
  { id: 'email-digest', type: 'output', subtype: 'email', label: 'Morning Email Digest', primaryAttribute: 'trading-desk@eventide.com', description: 'Daily email summary sent to stakeholders.' },
  { id: 'sql-positions', type: 'output', subtype: 'sql-table', label: 'SQL: positions_clean', primaryAttribute: 'positions_clean', description: 'Cleaned, reconciled positions table.' },
  { id: 'sql-risk', type: 'output', subtype: 'sql-table', label: 'SQL: risk_metrics', primaryAttribute: 'risk_metrics', description: 'Computed risk metrics table.' },
  { id: 'slack-alerts', type: 'output', label: 'Slack Risk Alerts', primaryAttribute: '#risk-alerts', description: 'Real-time alert messages posted to #risk-alerts.' },
  { id: 'pdf-report', type: 'output', subtype: 'pdf', label: 'PDF Investor Report', primaryAttribute: '/reports/investor_report.pdf', description: 'Formatted PDF distributed to investors.' },
  { id: 's3-archive', type: 'output', subtype: 'object-storage', label: 'S3 Archive', primaryAttribute: 's3://eventide-price-archive', description: 'Long-term cold storage of normalized price history.' },

  // --- Stakeholders ---
  { id: 'cio', type: 'stakeholder', label: 'CIO', primaryAttribute: 'Investment Office', description: 'Receives the daily investor report and email digest.' },

  // --- Secondary server: APAC desk (near-self-contained regional node) ---
  { id: 'apac-nucleus', type: 'nucleus', label: 'APAC Desk', description: 'Secondary regional server — mirrors the core pipeline for APAC markets, mostly self-contained.' },
  { id: 'apac-feed', type: 'source', subtype: 'api', label: 'SGX Feed', primaryAttribute: 'https://api.sgx.com/market-data', description: 'Real-time market data feed for APAC exchanges.' },
  { id: 'apac-risk', type: 'process', subtype: 'cron-script', label: 'apac_risk.py', primaryAttribute: '0 * * * *', description: 'Hourly regional VaR computation, mirrors risk_model.py.' },
  { id: 'apac-report', type: 'output', subtype: 'pdf', label: 'APAC PDF Report', primaryAttribute: '/reports/apac_report.pdf', description: 'Formatted regional report distributed to APAC stakeholders.' },
]

const edgeDefs: Array<Omit<GraphEdge, 'id'>> = [
  // server subtype hosts the database subtype it runs — tight structural
  // coupling, not a data flow
  { source: 'trading-db-server', target: 'internal-db', kind: 'hosts', volume: 5 },

  // nucleus ties the three domains together — structural, not a real data flow
  { source: 'nucleus', target: 'bloomberg', kind: 'feeds', volume: 2 },
  { source: 'nucleus', target: 'internal-db', kind: 'feeds', volume: 2 },
  { source: 'nucleus', target: 's3-raw', kind: 'feeds', volume: 2 },
  { source: 'nucleus', target: 'news-scraper', kind: 'feeds', volume: 2 },
  { source: 'nucleus', target: 'vendor-ftp', kind: 'feeds', volume: 2 },

  // sources -> processes
  { source: 'bloomberg', target: 'ingest-bloomberg', kind: 'feeds', volume: 10 },
  { source: 'internal-db', target: 'risk-model', kind: 'feeds', volume: 3 },
  { source: 'internal-db', target: 'reconcile-positions', kind: 'feeds', volume: 3 },
  { source: 's3-raw', target: 'reconcile-positions', kind: 'feeds', volume: 3 },
  { source: 'news-scraper', target: 'news-sentiment', kind: 'feeds', volume: 3 },
  { source: 'vendor-ftp', target: 'vendor-sync', kind: 'feeds', volume: 1 },

  // process -> process (spawning / child relationships)
  { source: 'ingest-bloomberg', target: 'normalize-prices', kind: 'calls', volume: 9 },
  { source: 'risk-model', target: 'risk-worker-1', kind: 'spawns', volume: 3 },
  { source: 'risk-model', target: 'risk-worker-2', kind: 'spawns', volume: 3 },

  // cross-feeds between processes
  { source: 'normalize-prices', target: 'risk-model', kind: 'feeds', volume: 2 },
  { source: 'news-sentiment', target: 'alerting-engine', kind: 'feeds', volume: 3 },
  { source: 'risk-model', target: 'alerting-engine', kind: 'feeds', volume: 3 },
  { source: 'reconcile-positions', target: 'report-builder', kind: 'feeds', volume: 2 },
  { source: 'risk-model', target: 'report-builder', kind: 'feeds', volume: 3 },
  { source: 'vendor-sync', target: 'reconcile-positions', kind: 'feeds', volume: 1 },

  // processes -> outputs
  { source: 'normalize-prices', target: 's3-archive', kind: 'produces', volume: 2 },
  { source: 'risk-worker-1', target: 'sql-risk', kind: 'produces', volume: 3 },
  { source: 'risk-worker-2', target: 'sql-risk', kind: 'produces', volume: 3 },
  { source: 'reconcile-positions', target: 'sql-positions', kind: 'produces', volume: 2 },
  { source: 'alerting-engine', target: 'slack-alerts', kind: 'produces', volume: 1 },
  { source: 'report-builder', target: 'website-dashboard', kind: 'produces', volume: 3 },
  { source: 'report-builder', target: 'email-digest', kind: 'produces', volume: 1 },
  { source: 'report-builder', target: 'pdf-report', kind: 'produces', volume: 1 },

  // output reaches its stakeholder
  { source: 'pdf-report', target: 'cio', kind: 'feeds', volume: 1 },

  // feedback loop: an output becomes a source for another process
  { source: 'sql-positions', target: 'risk-model', kind: 'cycles', volume: 2 },

  // secondary server ties lightly back to the central nucleus
  { source: 'nucleus', target: 'apac-nucleus', kind: 'feeds', volume: 1 },

  // APAC desk's own near-self-contained pipeline
  { source: 'apac-nucleus', target: 'apac-feed', kind: 'feeds', volume: 2 },
  { source: 'apac-feed', target: 'apac-risk', kind: 'feeds', volume: 8 },
  { source: 'apac-risk', target: 'apac-report', kind: 'produces', volume: 2 },
]

export const edges: GraphEdge[] = edgeDefs.map((e, i) => ({ id: `e${i + 1}`, ...e }))
