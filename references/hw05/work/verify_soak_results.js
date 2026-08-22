'use strict';

const fs = require('fs');
const readline = require('readline');

const STEADY_WINDOWS = [
  { name: 'early_steady', startSeconds: 60, endSeconds: 300 },
  { name: 'middle_steady', startSeconds: 300, endSeconds: 540 },
  { name: 'late_steady', startSeconds: 540, endSeconds: 780 },
];

const ACTIVE_WINDOWS = [
  { name: 'warmup_entry', startSeconds: 0, endSeconds: 60 },
  ...STEADY_WINDOWS,
  { name: 'exit_ramp', startSeconds: 780, endSeconds: 810 },
];

const STEPS = [
  'register',
  'login',
  'read_profile',
  'update_profile',
  'read_categories',
  'read_products',
  'read_product_detail',
  'add_to_cart',
  'checkout',
];

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--self-test') {
      result.selfTest = true;
      continue;
    }
    if (!argument.startsWith('--') || index + 1 >= argv.length) {
      throw new Error(`Invalid argument: ${argument}`);
    }
    result[argument.slice(2)] = argv[index + 1];
    index += 1;
  }
  return result;
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) {
    return sorted[lower];
  }
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function round(value, digits = 3) {
  return value === null || value === undefined || Number.isNaN(value)
    ? null
    : Number(value.toFixed(digits));
}

function numericStats(samples) {
  const valid = samples.filter((sample) => Number.isFinite(sample.value));
  if (valid.length === 0) {
    return {
      count: 0,
      min: null,
      median: null,
      mean: null,
      max: null,
      first: null,
      last: null,
      change: null,
      slopePerMinute: null,
    };
  }
  const values = valid.map((sample) => sample.value);
  const first = valid[0];
  const last = valid[valid.length - 1];
  const elapsedMinutes = (last.timeMs - first.timeMs) / 60_000;
  return {
    count: values.length,
    min: round(Math.min(...values)),
    median: round(percentile(values, 0.5)),
    mean: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    max: round(Math.max(...values)),
    first: round(first.value),
    last: round(last.value),
    change: round(last.value - first.value),
    slopePerMinute: elapsedMinutes > 0 ? round((last.value - first.value) / elapsedMinutes) : null,
  };
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  cells.push(current);
  return cells;
}

function readCsv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return [];
  }
  const lines = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return [];
  }
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function emptyWindow() {
  return {
    requests: 0,
    failures: 0,
    checksPass: 0,
    checksFail: 0,
    workflowPass: 0,
    workflowFail: 0,
    completedWorkflows: 0,
    durations: [],
    sameWindowIterationDurations: [],
    rawActualVUs: [],
    steps: Object.fromEntries(STEPS.map((step) => [step, { count: 0, durations: [] }])),
  };
}

function initializeWindows() {
  return Object.fromEntries(
    [...ACTIVE_WINDOWS.map((window) => window.name), 'graceful_completion']
      .map((name) => [name, emptyWindow()]),
  );
}

function activeWindowForTimestamp(timeMs, scenarioStartMs) {
  const elapsedSeconds = (timeMs - scenarioStartMs) / 1000;
  for (const window of ACTIVE_WINDOWS) {
    if (elapsedSeconds >= window.startSeconds && elapsedSeconds < window.endSeconds) {
      return window.name;
    }
  }
  return 'graceful_completion';
}

async function readRawMetrics(rawPath, scenarioStartMs) {
  const windows = initializeWindows();
  let crossWindowIterations = 0;
  const input = fs.createReadStream(rawPath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const point = JSON.parse(line);
    if (point.type !== 'Point' || !point.data) {
      continue;
    }
    const tags = point.data.tags || {};
    const pointTimeMs = Date.parse(point.data.time);
    const attributedWindow = Number.isFinite(pointTimeMs)
      ? activeWindowForTimestamp(pointTimeMs, scenarioStartMs)
      : tags.soak_window;
    const window = windows[attributedWindow];
    const value = Number(point.data.value);

    if (point.metric === 'soak_cross_window_iterations') {
      crossWindowIterations += value;
      continue;
    }
    if (!window) {
      continue;
    }

    if (point.metric === 'http_reqs') {
      window.requests += value;
      if (window.steps[tags.step]) {
        window.steps[tags.step].count += value;
      }
    } else if (point.metric === 'http_req_duration') {
      window.durations.push(value);
      if (window.steps[tags.step]) {
        window.steps[tags.step].durations.push(value);
      }
    } else if (point.metric === 'http_req_failed') {
      window.failures += value;
    } else if (point.metric === 'checks') {
      if (value === 1) {
        window.checksPass += 1;
      } else {
        window.checksFail += 1;
      }
    } else if (point.metric === 'workflow_success') {
      if (value === 1) {
        window.workflowPass += 1;
      } else {
        window.workflowFail += 1;
      }
    } else if (point.metric === 'soak_completed_workflows') {
      window.completedWorkflows += value;
    } else if (point.metric === 'soak_same_window_iteration_duration_ms') {
      window.sameWindowIterationDurations.push(value);
    } else if (point.metric === 'soak_actual_vus') {
      window.rawActualVUs.push(value);
    }
  }
  return { windows, crossWindowIterations };
}

function parseUtcMs(value, fieldName) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Metadata field ${fieldName} must be a valid timestamp`);
  }
  return parsed;
}

function windowForTimestamp(timeMs, scenarioStartMs, trafficEndMs) {
  if (timeMs < scenarioStartMs) {
    return 'pre_traffic';
  }
  const elapsedSeconds = (timeMs - scenarioStartMs) / 1000;
  for (const window of ACTIVE_WINDOWS) {
    if (elapsedSeconds >= window.startSeconds && elapsedSeconds < window.endSeconds) {
      return window.name;
    }
  }
  if (timeMs < trafficEndMs) {
    return 'graceful_completion';
  }
  return 'post_load_recovery';
}

function measuredWindowSeconds(window, scenarioStartMs, trafficEndMs) {
  const intendedStart = scenarioStartMs + window.startSeconds * 1000;
  const intendedEnd = scenarioStartMs + window.endSeconds * 1000;
  return Math.max(0, Math.min(intendedEnd, trafficEndMs) - intendedStart) / 1000;
}

function groupResourceRows(rows, scenarioStartMs, trafficEndMs) {
  const grouped = {};
  for (const row of rows) {
    const timeMs = Date.parse(row.timestamp_utc);
    if (!Number.isFinite(timeMs)) {
      continue;
    }
    const window = windowForTimestamp(timeMs, scenarioStartMs, trafficEndMs);
    const role = row.role || 'system';
    const key = `${role}:${window}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({ ...row, timeMs, attributed_window: window });
  }
  return grouped;
}

function resourceMetric(rows, field) {
  return numericStats(rows
    .filter((row) => row[field] !== '' && row[field] !== null && row[field] !== undefined)
    .map((row) => ({ timeMs: row.timeMs, value: Number(row[field]) })));
}

function availabilityStats(rows) {
  const available = rows.filter((row) => String(row.process_available).toLowerCase() === 'true').length;
  return { samples: rows.length, available, unavailable: rows.length - available };
}

function actualVuStats(resourceRows, rawValues) {
  const measured = resourceRows
    .filter((row) => row.actual_vus_live_source === 'k6_progress' && row.actual_vus_live !== '')
    .map((row) => Number(row.actual_vus_live))
    .filter(Number.isFinite);
  const values = measured.length > 0 ? measured : rawValues.filter(Number.isFinite);
  if (values.length === 0) {
    return { source: 'unavailable', samples: 0, min: null, max: null, mean: null, allTwelve: false };
  }
  return {
    source: measured.length > 0 ? 'k6_progress_resource_samples' : 'soak_actual_vus_raw_metric',
    samples: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    allTwelve: values.every((value) => value === 12),
  };
}

function describeMemoryDirection(resourceSummary, metricName) {
  const early = resourceSummary.backend?.early_steady?.[metricName];
  const middle = resourceSummary.backend?.middle_steady?.[metricName];
  const late = resourceSummary.backend?.late_steady?.[metricName];
  const recovery = resourceSummary.backend?.post_load_recovery?.[metricName];
  if (!early || !middle || !late || early.count === 0 || middle.count === 0 || late.count === 0) {
    return { steadyShape: 'insufficient_samples', recoveryDirection: 'insufficient_samples' };
  }
  let steadyShape = 'mixed_or_requires_human_review';
  if (early.mean < middle.mean && middle.mean < late.mean && late.change > 0) {
    steadyShape = 'directional_continued_rise';
  } else if (early.mean < middle.mean && late.mean >= middle.min && late.mean <= middle.max) {
    steadyShape = 'directional_rise_then_within_middle_band';
  } else if (early.mean === middle.mean && middle.mean === late.mean) {
    steadyShape = 'exactly_flat_window_means';
  }
  let recoveryDirection = 'not_observed';
  if (recovery && recovery.count > 0) {
    recoveryDirection = recovery.last < late.last
      ? 'decrease_from_late_last_to_recovery_last'
      : recovery.last > late.last
        ? 'increase_from_late_last_to_recovery_last'
        : 'no_change_from_late_last_to_recovery_last';
  }
  return { steadyShape, recoveryDirection };
}

function latencyStats(values) {
  return {
    p50: round(percentile(values, 0.5)),
    p90: round(percentile(values, 0.9)),
    p95: round(percentile(values, 0.95)),
    p99: round(percentile(values, 0.99)),
    max: values.length > 0 ? round(Math.max(...values)) : null,
  };
}

function buildReport(raw, processRows, systemRows, metadata, summary) {
  const scenarioStartMs = metadata.actual_k6_scenario_start_epoch_ms
    ? Number(metadata.actual_k6_scenario_start_epoch_ms)
    : parseUtcMs(metadata.actual_k6_scenario_start_utc, 'actual_k6_scenario_start_utc');
  const trafficEndMs = parseUtcMs(metadata.confirmed_traffic_end_utc, 'confirmed_traffic_end_utc');
  const processGroups = groupResourceRows(processRows, scenarioStartMs, trafficEndMs);
  const systemGroups = groupResourceRows(systemRows, scenarioStartMs, trafficEndMs);
  const resources = { backend: {}, k6: {}, system: {} };
  const allWindows = ['pre_traffic', ...ACTIVE_WINDOWS.map((window) => window.name), 'graceful_completion', 'post_load_recovery'];

  for (const window of allWindows) {
    for (const role of ['backend', 'k6']) {
      const rows = processGroups[`${role}:${window}`] || [];
      resources[role][window] = {
        availability: availabilityStats(rows),
        cpu: resourceMetric(rows, 'cpu_percent_total_machine'),
        workingSetMb: resourceMetric(rows, 'working_set_mb'),
        privateMemoryMb: resourceMetric(rows, 'private_memory_mb'),
        threads: resourceMetric(rows, 'thread_count'),
      };
    }
    const rows = systemGroups[`system:${window}`] || [];
    resources.system[window] = {
      cpu: resourceMetric(rows, 'cpu_percent'),
      committedMemoryPercent: resourceMetric(rows, 'committed_memory_percent'),
      diskBytesPerSecond: resourceMetric(rows, 'disk_bytes_per_second'),
    };
  }

  const steady = {};
  for (const definition of STEADY_WINDOWS) {
    const values = raw.windows[definition.name];
    const durationSeconds = measuredWindowSeconds(definition, scenarioStartMs, trafficEndMs);
    const backendRows = processGroups[`backend:${definition.name}`] || [];
    steady[definition.name] = {
      durationSeconds: round(durationSeconds),
      actualVUs: actualVuStats(backendRows, values.rawActualVUs),
      requests: values.requests,
      requestsPerSecond: durationSeconds > 0 ? round(values.requests / durationSeconds, 6) : null,
      completedWorkflows: values.completedWorkflows,
      workflowsPerSecond: durationSeconds > 0 ? round(values.completedWorkflows / durationSeconds, 6) : null,
      httpFailures: values.failures,
      checksPass: values.checksPass,
      checksFail: values.checksFail,
      workflowPass: values.workflowPass,
      workflowFail: values.workflowFail,
      latency: latencyStats(values.durations),
      sameWindowIterationDuration: latencyStats(values.sameWindowIterationDurations),
      steps: Object.fromEntries(STEPS.map((step) => [step, {
        count: values.steps[step].count,
        p95: round(percentile(values.steps[step].durations, 0.95)),
        p99: round(percentile(values.steps[step].durations, 0.99)),
      }])),
    };
  }

  const rates = STEADY_WINDOWS.map((window) => steady[window.name]);
  const early = steady.early_steady;
  const late = steady.late_steady;
  const requestDifference = late.requestsPerSecond - early.requestsPerSecond;
  const workflowDifference = late.workflowsPerSecond - early.workflowsPerSecond;
  const throughput = {
    minimumRequestsPerSecond: round(Math.min(...rates.map((window) => window.requestsPerSecond)), 6),
    minimumWorkflowsPerSecond: round(Math.min(...rates.map((window) => window.workflowsPerSecond)), 6),
    earlyToLateRequestsPerSecondDifference: round(requestDifference, 6),
    earlyToLateRequestsPerSecondPercent: early.requestsPerSecond !== 0
      ? round((requestDifference / early.requestsPerSecond) * 100, 3)
      : null,
    earlyToLateWorkflowsPerSecondDifference: round(workflowDifference, 6),
    earlyToLateWorkflowsPerSecondPercent: early.workflowsPerSecond !== 0
      ? round((workflowDifference / early.workflowsPerSecond) * 100, 3)
      : null,
    candidateFloorOnly: true,
    automaticStableLabel: false,
    automaticMaximumStableRpsLabel: false,
    humanStabilityReviewRequired: true,
  };

  const correctnessPreserved = rates.every((window) => (
    window.httpFailures === 0 &&
    window.checksFail === 0 &&
    window.workflowFail === 0
  ));
  const actualVUsEstablished = rates.every((window) => window.actualVUs.allTwelve);

  return {
    generatedAtUtc: new Date().toISOString(),
    runId: metadata.run_id,
    scenarioStartUtc: new Date(scenarioStartMs).toISOString(),
    trafficEndUtc: new Date(trafficEndMs).toISOString(),
    steady,
    crossWindowIterations: raw.crossWindowIterations,
    throughput,
    stabilityWordingGate: {
      actualVUsEstablished,
      correctnessPreserved,
      lateCollapseMateriality: 'human_review_required_no_fixed_percentage_slo',
      generatorOrSharedMachineDominance: 'human_review_required',
      latencyAndResourceContext: 'human_review_required',
      stableWordingAutomaticallyAuthorized: false,
    },
    resources,
    memoryDirection: {
      workingSet: describeMemoryDirection(resources, 'workingSetMb'),
      privateMemory: describeMemoryDirection(resources, 'privateMemoryMb'),
      causalDiagnosis: 'not_performed',
    },
    globalSummary: summary || null,
  };
}

function format(value) {
  return value === null || value === undefined ? 'n/a' : String(value);
}

function renderMarkdown(report) {
  const lines = [
    '# Official Soak Factual Window Summary',
    '',
    `- Run ID: \`${report.runId}\``,
    `- Actual k6 scenario start: \`${report.scenarioStartUtc}\``,
    `- Confirmed traffic end: \`${report.trafficEndUtc}\``,
    '- Scope: factual Task 1 measurements only; no Task 2 interpretation is performed.',
    '',
    '## Steady Window Measurements',
    '',
    '| Window | Measured s | Actual VUs samples/min/max | Requests | req/s | Workflows | workflows/s | HTTP failures | Checks pass/fail | Workflow pass/fail | p50 ms | p90 ms | p95 ms | p99 ms | max ms |',
    '|---|---:|---|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---:|',
  ];
  for (const window of STEADY_WINDOWS) {
    const value = report.steady[window.name];
    lines.push(`| ${window.name} | ${format(value.durationSeconds)} | ${value.actualVUs.samples}/${format(value.actualVUs.min)}/${format(value.actualVUs.max)} | ${value.requests} | ${format(value.requestsPerSecond)} | ${value.completedWorkflows} | ${format(value.workflowsPerSecond)} | ${value.httpFailures} | ${value.checksPass}/${value.checksFail} | ${value.workflowPass}/${value.workflowFail} | ${format(value.latency.p50)} | ${format(value.latency.p90)} | ${format(value.latency.p95)} | ${format(value.latency.p99)} | ${format(value.latency.max)} |`);
  }

  lines.push('', '## Per-Step Tail Latency', '');
  lines.push('| Window | Step | Count | p95 ms | p99 ms |', '|---|---|---:|---:|---:|');
  for (const window of STEADY_WINDOWS) {
    for (const step of STEPS) {
      const value = report.steady[window.name].steps[step];
      lines.push(`| ${window.name} | ${step} | ${value.count} | ${format(value.p95)} | ${format(value.p99)} |`);
    }
  }

  const throughput = report.throughput;
  lines.push(
    '',
    '## Empirical Throughput Facts',
    '',
    `- Minimum observed steady-window request rate: **${format(throughput.minimumRequestsPerSecond)} req/s**.`,
    `- Minimum observed steady-window completed-workflow rate: **${format(throughput.minimumWorkflowsPerSecond)} workflows/s**.`,
    `- Early-to-late request-rate change: **${format(throughput.earlyToLateRequestsPerSecondDifference)} req/s (${format(throughput.earlyToLateRequestsPerSecondPercent)}%)**.`,
    `- Early-to-late workflow-rate change: **${format(throughput.earlyToLateWorkflowsPerSecondDifference)} workflows/s (${format(throughput.earlyToLateWorkflowsPerSecondPercent)}%)**.`,
    `- Cross-window iterations: **${report.crossWindowIterations}**.`,
    '',
    'The minima are candidate empirical floors only. This verifier does not label them stable, maximum stable RPS, an SLO, or capacity.',
    '',
    '## Stability Wording Gate',
    '',
    `- Actual 12-VU condition established in all compared windows: **${report.stabilityWordingGate.actualVUsEstablished}**.`,
    `- Measured correctness preserved in all compared windows: **${report.stabilityWordingGate.correctnessPreserved}**.`,
    '- Material late collapse: human review required; no fixed percentage SLO is applied.',
    '- Generator/shared-machine dominance: human review required.',
    '- Latency and resources: human review required.',
    '- Stable-throughput wording is never authorized automatically.',
    '',
    '## Backend Memory Facts',
    '',
    '| Window | Metric | Samples | Min | Median | Mean | Max | First | Last | Change | Approx. per minute |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  );
  for (const window of [...STEADY_WINDOWS.map((item) => item.name), 'post_load_recovery']) {
    for (const [label, key] of [['working_set_mb', 'workingSetMb'], ['private_memory_mb', 'privateMemoryMb']]) {
      const value = report.resources.backend[window][key];
      lines.push(`| ${window} | ${label} | ${value.count} | ${format(value.min)} | ${format(value.median)} | ${format(value.mean)} | ${format(value.max)} | ${format(value.first)} | ${format(value.last)} | ${format(value.change)} | ${format(value.slopePerMinute)} |`);
    }
  }
  lines.push(
    '',
    `- Working-set direction: \`${report.memoryDirection.workingSet.steadyShape}\`; recovery: \`${report.memoryDirection.workingSet.recoveryDirection}\`.`,
    `- Private-memory direction: \`${report.memoryDirection.privateMemory.steadyShape}\`; recovery: \`${report.memoryDirection.privateMemory.recoveryDirection}\`.`,
    '- These are factual directional descriptions, not a leak, defect, or capacity diagnosis.',
    '',
    '## Resource Evidence Boundary',
    '',
    'Backend, k6, and whole-machine samples are retained separately. Causal interpretation remains for later human review.',
  );
  return `${lines.join('\n')}\n`;
}

function runSelfTest() {
  const assert = require('assert');
  assert.strictEqual(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.deepStrictEqual(parseCsvLine('"a","b,b","c"'), ['a', 'b,b', 'c']);
  const stats = numericStats([
    { timeMs: 0, value: 10 },
    { timeMs: 60_000, value: 12 },
  ]);
  assert.strictEqual(stats.change, 2);
  assert.strictEqual(stats.slopePerMinute, 2);
  assert.strictEqual(windowForTimestamp(61_000, 0, 820_000), 'early_steady');
  assert.strictEqual(windowForTimestamp(811_000, 0, 820_000), 'graceful_completion');
  assert.strictEqual(windowForTimestamp(821_000, 0, 820_000), 'post_load_recovery');

  const scenarioStartMs = 1_700_000_000_000;
  const raw = { windows: initializeWindows(), crossWindowIterations: 3 };
  const planned = {
    early_steady: { requests: 2400, workflows: 240 },
    middle_steady: { requests: 2160, workflows: 216 },
    late_steady: { requests: 1920, workflows: 192 },
  };
  const processRows = [];
  const systemRows = [];
  for (const definition of STEADY_WINDOWS) {
    const values = raw.windows[definition.name];
    values.requests = planned[definition.name].requests;
    values.completedWorkflows = planned[definition.name].workflows;
    values.checksPass = planned[definition.name].requests;
    values.workflowPass = planned[definition.name].workflows;
    values.durations = [10, 20, 30];
    for (const offset of [1, 239]) {
      const timestamp = new Date(scenarioStartMs + (definition.startSeconds + offset) * 1000).toISOString();
      processRows.push({
        timestamp_utc: timestamp,
        role: 'backend',
        process_available: 'True',
        actual_vus_live: '12',
        actual_vus_live_source: 'k6_progress',
        cpu_percent_total_machine: '1',
        working_set_mb: String(50 + definition.startSeconds / 60 + offset / 1000),
        private_memory_mb: String(60 + definition.startSeconds / 60 + offset / 1000),
        thread_count: '12',
      });
      processRows.push({
        timestamp_utc: timestamp,
        role: 'k6',
        process_available: 'True',
        actual_vus_live: '12',
        actual_vus_live_source: 'k6_progress',
        cpu_percent_total_machine: '1',
        working_set_mb: '70',
        private_memory_mb: '80',
        thread_count: '10',
      });
      systemRows.push({
        timestamp_utc: timestamp,
        cpu_percent: '20',
        committed_memory_percent: '80',
        disk_bytes_per_second: '1000',
      });
    }
  }
  const report = buildReport(raw, processRows, systemRows, {
    run_id: 'fixture01',
    actual_k6_scenario_start_epoch_ms: scenarioStartMs,
    confirmed_traffic_end_utc: new Date(scenarioStartMs + 820_000).toISOString(),
  }, {});
  assert.strictEqual(report.throughput.minimumRequestsPerSecond, 8);
  assert.strictEqual(report.throughput.minimumWorkflowsPerSecond, 0.8);
  assert.strictEqual(report.throughput.earlyToLateRequestsPerSecondPercent, -20);
  assert.strictEqual(report.throughput.automaticStableLabel, false);
  assert.strictEqual(report.stabilityWordingGate.actualVUsEstablished, true);
  assert.strictEqual(report.crossWindowIterations, 3);
  assert.strictEqual(report.resources.backend.early_steady.workingSetMb.count, 2);
  process.stdout.write('verify_soak_results self-test: PASS\n');
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (args.selfTest) {
    runSelfTest();
    return;
  }
  for (const required of ['raw', 'process', 'system', 'metadata', 'summary', 'output']) {
    if (!args[required]) {
      throw new Error(`Missing --${required}`);
    }
  }
  const metadata = JSON.parse(fs.readFileSync(args.metadata, 'utf8').replace(/^\uFEFF/, ''));
  const scenarioStartMs = metadata.actual_k6_scenario_start_epoch_ms
    ? Number(metadata.actual_k6_scenario_start_epoch_ms)
    : parseUtcMs(metadata.actual_k6_scenario_start_utc, 'actual_k6_scenario_start_utc');
  const raw = await readRawMetrics(args.raw, scenarioStartMs);
  const processRows = readCsv(args.process);
  const systemRows = readCsv(args.system);
  const summary = JSON.parse(fs.readFileSync(args.summary, 'utf8').replace(/^\uFEFF/, ''));
  const report = buildReport(raw, processRows, systemRows, metadata, summary);
  fs.writeFileSync(args.output, renderMarkdown(report), 'utf8');
  process.stdout.write(`${JSON.stringify({
    output: args.output,
    candidateMinimumRequestsPerSecond: report.throughput.minimumRequestsPerSecond,
    candidateMinimumWorkflowsPerSecond: report.throughput.minimumWorkflowsPerSecond,
    stableWordingAutomaticallyAuthorized: false,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
