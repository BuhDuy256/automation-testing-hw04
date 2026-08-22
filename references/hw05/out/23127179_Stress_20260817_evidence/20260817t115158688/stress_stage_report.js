function metricValues(data, name) {
  return data.metrics[name]?.values || null;
}

function metricNumber(data, name, field) {
  const value = metricValues(data, name)?.[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatNumber(value, digits = 2) {
  return value === null ? 'n/a' : value.toFixed(digits);
}

function formatPercent(value) {
  return value === null ? 'n/a' : `${(value * 100).toFixed(2)}%`;
}

function observedStageSeconds(data, phase) {
  const testRunDurationMs = data.state?.testRunDurationMs;
  if (typeof testRunDurationMs !== 'number') {
    return null;
  }
  return Math.max(0, Math.min(testRunDurationMs, phase.endMs) - phase.startMs) / 1000;
}

function derivedRate(count, seconds) {
  if (count === null || seconds === null || seconds <= 0) {
    return null;
  }
  return count / seconds;
}

function thresholdResult(data, metricName, expression) {
  const result = data.metrics[metricName]?.thresholds?.[expression]?.ok;
  if (result === true) {
    return 'PASS';
  }
  if (result === false) {
    return 'FAIL';
  }
  return 'NOT AVAILABLE';
}

function buildStageRows(data, measurementPhases) {
  const rows = [];
  for (const phase of measurementPhases) {
    const prefix = `stress_${phase.level}`;
    const seconds = observedStageSeconds(data, phase);
    const requests = metricNumber(data, `${prefix}_http_requests`, 'count');
    const workflows = metricNumber(data, `${prefix}_workflows_completed`, 'count');
    rows.push([
      phase.level,
      phase.targetVUs,
      formatNumber(seconds, 1),
      requests ?? 'n/a',
      formatNumber(derivedRate(requests, seconds), 3),
      workflows ?? 'n/a',
      formatNumber(derivedRate(workflows, seconds), 3),
      formatPercent(metricNumber(data, `${prefix}_http_failure_rate`, 'rate')),
      metricNumber(data, `${prefix}_http_failure_rate`, 'passes') ?? 'n/a',
      formatPercent(metricNumber(data, `${prefix}_checks`, 'rate')),
      `${metricNumber(data, `${prefix}_checks`, 'passes') ?? 'n/a'}/${metricNumber(data, `${prefix}_checks`, 'fails') ?? 'n/a'}`,
      formatPercent(metricNumber(data, `${prefix}_workflow_success`, 'rate')),
      `${metricNumber(data, `${prefix}_workflow_success`, 'passes') ?? 'n/a'}/${metricNumber(data, `${prefix}_workflow_success`, 'fails') ?? 'n/a'}`,
      formatNumber(metricNumber(data, `${prefix}_http_duration_ms`, 'p(50)')),
      formatNumber(metricNumber(data, `${prefix}_http_duration_ms`, 'p(90)')),
      formatNumber(metricNumber(data, `${prefix}_http_duration_ms`, 'p(95)')),
      formatNumber(metricNumber(data, `${prefix}_http_duration_ms`, 'p(99)')),
      formatNumber(metricNumber(data, `${prefix}_iteration_duration_ms`, 'p(95)')),
    ]);
  }
  return rows;
}

function buildStepRows(data, measurementPhases, steps) {
  const rows = [];
  for (const phase of measurementPhases) {
    const prefix = `stress_${phase.level}`;
    for (const step of steps) {
      const metricName = `${prefix}_latency_${step}_ms`;
      rows.push([
        phase.level,
        step,
        metricNumber(data, `${prefix}_requests_${step}`, 'count') ?? 'n/a',
        formatNumber(metricNumber(data, metricName, 'p(95)')),
        formatNumber(metricNumber(data, metricName, 'p(99)')),
      ]);
    }
  }
  return rows;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

export function buildStressMarkdown(data, runId, measurementPhases, steps) {
  const stageRows = buildStageRows(data, measurementPhases);
  const stepRows = buildStepRows(data, measurementPhases, steps);
  const baseline = stageRows.find((row) => row[0] === 'baseline_4');
  const recovery = stageRows.find((row) => row[0] === 'recovery_4');
  const recoveryRows = baseline && recovery
    ? [
      ['Opening', baseline[0], baseline[4], baseline[14], baseline[15], baseline[16], baseline[11]],
      ['Recovery', recovery[0], recovery[4], recovery[14], recovery[15], recovery[16], recovery[11]],
    ]
    : [];

  return [
    '# Official Stress Stage Summary',
    '',
    '- Test plan: `23127179_Stress_20260817`',
    `- K6_RUN_ID: \`${runId}\``,
    `- Generated at: \`${new Date().toISOString()}\``,
    '- Designated report: custom k6 end-of-test Markdown Stress Stage Summary',
    '- Stage aggregates: DIRECT K6 STAGE AGGREGATE from stage-named Trend/Counter/Rate metrics',
    '- Stage request/workflow rates: DERIVED FROM DIRECT K6 STAGE COUNTERS divided by actual observed stage seconds',
    '- External backend/k6/system resource values are not available inside handleSummary(); see the invocation resource CSV files.',
    '',
    '## Reviewed workload',
    '',
    '`1->4/30s; 4/2m; 4->8/30s; 8/2m; 8->12/30s; 12/2m; 12->16/30s; 16/2m; 16->20/30s; 20/2m; 20->24/30s; 24/2m; 24->4/1m; 4/2m recovery; 4->0/1m; gracefulRampDown=30s; gracefulStop=30s`',
    '',
    '## Correctness threshold status',
    '',
    markdownTable(
      ['Metric', 'Threshold', 'Result'],
      [
        ['http_req_failed', 'rate==0', thresholdResult(data, 'http_req_failed', 'rate==0')],
        ['checks', 'rate==1', thresholdResult(data, 'checks', 'rate==1')],
        ['workflow_success', 'rate==1', thresholdResult(data, 'workflow_success', 'rate==1')],
      ],
    ),
    '',
    'No latency, iteration-duration, RPS, endpoint, or per-stage latency threshold is applied.',
    '',
    '## Measurement plateau comparison',
    '',
    markdownTable(
      ['Stress level', 'Target VUs', 'Observed s', 'Requests', 'Derived req/s', 'Completed workflows', 'Derived workflows/s', 'HTTP failure rate', 'HTTP failure count', 'Checks', 'Check pass/fail', 'Workflow success', 'Workflow pass/fail', 'HTTP p50 ms', 'HTTP p90 ms', 'HTTP p95 ms', 'HTTP p99 ms', 'Same-stage iteration p95 ms'],
      stageRows,
    ),
    '',
    'A same-stage iteration duration is recorded only when an iteration starts and ends in the same measurement plateau. Cross-stage iterations remain in raw evidence and the `stress_cross_stage_iterations` counter.',
    '',
    '## Opening versus recovery at 4 VUs',
    '',
    recoveryRows.length > 0
      ? markdownTable(['Position', 'Stress level', 'Derived req/s', 'HTTP p90 ms', 'HTTP p95 ms', 'HTTP p99 ms', 'Workflow success'], recoveryRows)
      : 'Opening or recovery aggregates were unavailable because the run did not cover both stages.',
    '',
    '## Per-step tail latency by measurement plateau',
    '',
    markdownTable(['Stress level', 'Step', 'Samples', 'p95 ms', 'p99 ms'], stepRows),
    '',
    '## Interpretation boundary',
    '',
    'This report presents measurements only. Apply the human-reviewed multi-signal degradation criteria to the raw and resource evidence after execution; do not infer a business SLO or breaking point from one percentile.',
    '',
  ].join('\n');
}
