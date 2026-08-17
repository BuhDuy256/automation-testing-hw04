#!/usr/bin/env node
// HW05 Task 3 — evaluates a Soak k6 run's raw NDJSON output.
//
// GATED guards (fail CI if violated):
//   - http_req_failed == 0, checks == 1, workflow_success == 1 — hardware-independent
//     correctness, reused from work/context_handoff_after_task2_before_task3.md as-is.
//   - early-to-late throughput degradation <= 5% — a same-run RELATIVE comparison (late window
//     vs. early window on the same run, same hardware), so it stays meaningful even when the
//     absolute throughput numbers below are not comparable across hardware.
//
// INFORMATIONAL ONLY (reported, does NOT fail CI):
//   - sustained throughput >= 7.983 req/s and clean workflow rate >= 0.829 workflows/s. These
//     are ABSOLUTE numbers empirically measured on the student's local Dell hardware in Task 1.
//     This CI job runs on GitHub-hosted `ubuntu-latest`, which is different hardware with no
//     established relationship to that measurement. Gating CI on them would silently compare
//     two different machines and call the result a "regression" against the human-reviewed
//     baseline, which Task 2 explicitly scoped to "comparable hardware, dataset, harness/
//     profile." They are still computed and reported for visibility. See "Hardware Scope" in
//     work/task3_continuous_performance_pipeline.md.
//
// All guards are valid only for the full 12-VU/12-minute protocol run by the frozen
// out/23127179_Soak_20260817.js script, which already tags every request/check with
// `soak_window` (early_steady / middle_steady / late_steady / warmup_entry / exit_ramp). This
// evaluator groups by that existing tag instead of recomputing wall-clock windows, so it stays
// faithful to the reviewed Task 1/2 methodology (work/task2_performance_analysis.md,
// out/23127179_Soak_20260817_evidence/*/verify_soak_results.js) without duplicating its full
// evidence-grade report (screenshots, resource CSVs, database facts).
'use strict';

const fs = require('fs');
const readline = require('readline');

const STEADY_WINDOWS = ['early_steady', 'middle_steady', 'late_steady'];
const WINDOW_SECONDS = 240; // 60-300, 300-540, 540-780 — matches the reviewed Soak protocol.

const GUARDS = {
  throughput: 7.983,
  workflowRate: 0.829,
  maxDegradationPercent: 5,
};

function emptyWindow() {
  return { requests: 0, failures: 0, checksPass: 0, checksFail: 0, workflowPass: 0, workflowFail: 0, completedWorkflows: 0 };
}

async function aggregate(rawPath) {
  const windows = Object.fromEntries(STEADY_WINDOWS.map((name) => [name, emptyWindow()]));
  let totalRequests = 0;
  let totalFailures = 0;
  let totalChecksPass = 0;
  let totalChecksFail = 0;
  let totalWorkflowPass = 0;
  let totalWorkflowFail = 0;

  const input = fs.createReadStream(rawPath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of lines) {
    if (!line.trim()) continue;
    let point;
    try {
      point = JSON.parse(line);
    } catch (_) {
      continue;
    }
    if (point.type !== 'Point' || !point.data) continue;
    const tags = point.data.tags || {};
    const value = Number(point.data.value);
    const window = windows[tags.soak_window];

    if (point.metric === 'http_reqs') {
      totalRequests += value;
      if (window) window.requests += value;
    } else if (point.metric === 'http_req_failed') {
      totalFailures += value;
      if (window) window.failures += value;
    } else if (point.metric === 'checks') {
      if (value === 1) {
        totalChecksPass += 1;
        if (window) window.checksPass += 1;
      } else {
        totalChecksFail += 1;
        if (window) window.checksFail += 1;
      }
    } else if (point.metric === 'workflow_success') {
      if (value === 1) {
        totalWorkflowPass += 1;
        if (window) window.workflowPass += 1;
      } else {
        totalWorkflowFail += 1;
        if (window) window.workflowFail += 1;
      }
    } else if (point.metric === 'soak_completed_workflows') {
      if (window) window.completedWorkflows += value;
    }
  }

  return {
    windows,
    totals: { totalRequests, totalFailures, totalChecksPass, totalChecksFail, totalWorkflowPass, totalWorkflowFail },
  };
}

function round(value, digits = 4) {
  return typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(digits)) : value;
}

function main() {
  const rawPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!rawPath || !outputPath) {
    process.stderr.write('Usage: evaluate_endurance.js <raw-results.ndjson> <endurance-summary.json>\n');
    process.exit(2);
  }

  aggregate(rawPath).then(({ windows, totals }) => {
    const rates = STEADY_WINDOWS.map((name) => {
      const w = windows[name];
      return {
        window: name,
        requestsPerSecond: round(w.requests / WINDOW_SECONDS, 6),
        workflowsPerSecond: round(w.completedWorkflows / WINDOW_SECONDS, 6),
        requests: w.requests,
        completedWorkflows: w.completedWorkflows,
        httpFailures: w.failures,
        checksFail: w.checksFail,
        workflowFail: w.workflowFail,
      };
    });

    const early = rates[0];
    const late = rates[2];
    const minRequestsPerSecond = Math.min(...rates.map((r) => r.requestsPerSecond));
    const minWorkflowsPerSecond = Math.min(...rates.map((r) => r.workflowsPerSecond));
    const requestDegradationPercent = early.requestsPerSecond > 0
      ? round(((early.requestsPerSecond - late.requestsPerSecond) / early.requestsPerSecond) * 100, 3)
      : null;

    const overallHttpFailedRate = totals.totalRequests > 0 ? totals.totalFailures / totals.totalRequests : null;
    const overallChecksRate = (totals.totalChecksPass + totals.totalChecksFail) > 0
      ? totals.totalChecksPass / (totals.totalChecksPass + totals.totalChecksFail)
      : null;
    const overallWorkflowRate = (totals.totalWorkflowPass + totals.totalWorkflowFail) > 0
      ? totals.totalWorkflowPass / (totals.totalWorkflowPass + totals.totalWorkflowFail)
      : null;

    const guardResults = [
      {
        metric: 'http_req_failed',
        observed: round(overallHttpFailedRate, 4),
        guard: '== 0',
        gated: true,
        result: overallHttpFailedRate === 0 ? 'PASS' : 'FAIL',
      },
      {
        metric: 'checks',
        observed: round(overallChecksRate, 4),
        guard: '== 1',
        gated: true,
        result: overallChecksRate === 1 ? 'PASS' : 'FAIL',
      },
      {
        metric: 'workflow_success',
        observed: round(overallWorkflowRate, 4),
        guard: '== 1',
        gated: true,
        result: overallWorkflowRate === 1 ? 'PASS' : 'FAIL',
      },
      {
        metric: 'early-to-late throughput degradation',
        observed: requestDegradationPercent,
        guard: `<= ${GUARDS.maxDegradationPercent}%`,
        gated: true,
        result: requestDegradationPercent !== null && requestDegradationPercent <= GUARDS.maxDegradationPercent ? 'PASS' : 'FAIL',
      },
      {
        metric: 'sustained throughput (min steady-window req/s) [INFORMATIONAL ONLY on ubuntu-latest — see file header]',
        observed: round(minRequestsPerSecond, 3),
        guard: `>= ${GUARDS.throughput} req/s (Dell-hardware absolute number, not gated here)`,
        gated: false,
        result: minRequestsPerSecond >= GUARDS.throughput ? 'INFO (at/above Dell baseline)' : 'INFO (below Dell baseline)',
      },
      {
        metric: 'clean workflow rate (min steady-window workflows/s) [INFORMATIONAL ONLY on ubuntu-latest — see file header]',
        observed: round(minWorkflowsPerSecond, 3),
        guard: `>= ${GUARDS.workflowRate} workflows/s (Dell-hardware absolute number, not gated here)`,
        gated: false,
        result: minWorkflowsPerSecond >= GUARDS.workflowRate ? 'INFO (at/above Dell baseline)' : 'INFO (below Dell baseline)',
      },
    ];

    const allPassed = guardResults.filter((row) => row.gated).every((row) => row.result === 'PASS');

    const lines = [
      '# CI Endurance Regression — Result',
      '',
      'Scope: full 12-VU/12-minute Soak protocol only. Not a business SLO, maximum capacity, or',
      'production guarantee — these are regression guards for a comparable harness/profile.',
      '',
      'Hardware note: this job runs on GitHub-hosted `ubuntu-latest`, not the local Dell hardware',
      'the 7.983 req/s / 0.829 workflows/s Task 1 floor was measured on. Correctness and the',
      'early-to-late degradation guard are hardware-independent (relative, same-run comparisons)',
      'and gate CI. The two absolute throughput/workflow-rate numbers are reported for visibility',
      'only and do NOT gate CI on this runner — see the file header of evaluate_endurance.js.',
      '',
      '| Window | Requests | req/s | Completed workflows | workflows/s |',
      '|---|---:|---:|---:|---:|',
      ...rates.map((r) => `| ${r.window} | ${r.requests} | ${r.requestsPerSecond} | ${r.completedWorkflows} | ${r.workflowsPerSecond} |`),
      '',
      '| Metric | Observed | Guard | Result |',
      '|---|---:|---|---|',
      ...guardResults.map((row) => `| ${row.metric} | ${row.observed ?? 'n/a'} | ${row.guard} | ${row.result} |`),
      '',
      `Overall: **${allPassed ? 'PASS' : 'FAIL'}**`,
      '',
    ];

    const report = {
      generatedAtUtc: new Date().toISOString(),
      scope: 'ci_endurance_full_soak_profile',
      hardware: 'github-hosted ubuntu-latest (not the Dell hardware the Task 1 floor was measured on)',
      absoluteThroughputGuardStatus: 'informational only on this hardware — not gated, see file header',
      steadyWindows: rates,
      guards: guardResults,
      overall: allPassed ? 'PASS' : 'FAIL',
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(outputPath.replace(/\.json$/, '.md'), lines.join('\n'), 'utf8');
    process.stdout.write(lines.join('\n'));
    process.stdout.write('\n');

    if (!allPassed) {
      process.exitCode = 1;
    }
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

main();
