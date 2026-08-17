#!/usr/bin/env node
// HW05 Task 3 — evaluates the CI regression k6 run's --summary-export JSON against the
// HUMAN-APPROVED regression guards from work/task2_performance_analysis.md /
// work/context_handoff_after_task2_before_task3.md:
//   http_req_failed == 0, checks == 1, workflow_success == 1,
//   HTTP p95 <= 25 ms, HTTP p99 <= 50 ms.
// These are regression guards for a comparable harness/profile, not business SLOs, maximum
// capacity, or production guarantees. Throughput/endurance guards are evaluated separately by
// evaluate_endurance.js against the full 12-VU/12-minute profile.
'use strict';

const fs = require('fs');

const GUARDS = [
  {
    metric: 'http_req_failed',
    unit: 'rate',
    observed: (s) => s.metrics.http_req_failed?.value,
    comparator: 'eq',
    threshold: 0,
    describe: (t) => `== ${t}`,
  },
  {
    metric: 'checks',
    unit: 'rate',
    observed: (s) => s.metrics.checks?.value,
    comparator: 'eq',
    threshold: 1,
    describe: (t) => `== ${t}`,
  },
  {
    metric: 'workflow_success',
    unit: 'rate',
    observed: (s) => s.metrics.workflow_success?.value,
    comparator: 'eq',
    threshold: 1,
    describe: (t) => `== ${t}`,
  },
  {
    metric: 'http_req_duration p(95)',
    unit: 'ms',
    observed: (s) => s.metrics.http_req_duration?.['p(95)'],
    comparator: 'lte',
    threshold: 25,
    describe: (t) => `<= ${t} ms`,
  },
  {
    metric: 'http_req_duration p(99)',
    unit: 'ms',
    observed: (s) => s.metrics.http_req_duration?.['p(99)'],
    comparator: 'lte',
    threshold: 50,
    describe: (t) => `<= ${t} ms`,
  },
];

function evaluate(comparator, observed, threshold) {
  if (typeof observed !== 'number' || Number.isNaN(observed)) {
    return false;
  }
  if (comparator === 'eq') {
    return observed === threshold;
  }
  if (comparator === 'lte') {
    return observed <= threshold;
  }
  throw new Error(`Unknown comparator: ${comparator}`);
}

function round(value, digits = 3) {
  return typeof value === 'number' ? Number(value.toFixed(digits)) : value;
}

function main() {
  const summaryPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!summaryPath || !outputPath) {
    process.stderr.write('Usage: evaluate_regression.js <summary.json> <regression-summary.json>\n');
    process.exit(2);
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

  const results = GUARDS.map((guard) => {
    const observedRaw = guard.observed(summary);
    const observed = round(observedRaw, guard.unit === 'rate' ? 4 : 3);
    const passed = evaluate(guard.comparator, observedRaw, guard.threshold);
    return {
      metric: guard.metric,
      observed,
      unit: guard.unit,
      guard: guard.describe(guard.threshold),
      result: passed ? 'PASS' : 'FAIL',
    };
  });

  const allPassed = results.every((row) => row.result === 'PASS');

  const lines = [
    '# CI Performance Regression — Result',
    '',
    'Scope: correctness + latency regression guards only, evaluated on the short CI profile.',
    'Not a business SLO, maximum capacity, or production guarantee.',
    '',
    '| Metric | Observed | Guard | Result |',
    '|---|---:|---|---|',
    ...results.map((row) => `| ${row.metric} | ${row.observed ?? 'n/a'} ${row.unit === 'ms' ? 'ms' : ''} | ${row.guard} | ${row.result} |`),
    '',
    `Overall: **${allPassed ? 'PASS' : 'FAIL'}**`,
    '',
  ];

  const report = {
    generatedAtUtc: new Date().toISOString(),
    scope: 'ci_regression_short_profile',
    guards: results,
    overall: allPassed ? 'PASS' : 'FAIL',
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(outputPath.replace(/\.json$/, '.md'), lines.join('\n'), 'utf8');

  process.stdout.write(lines.join('\n'));
  process.stdout.write('\n');

  if (!allPassed) {
    process.exitCode = 1;
  }
}

main();
