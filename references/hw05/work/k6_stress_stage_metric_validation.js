import exec from 'k6/execution';
import { Counter, Rate, Trend } from 'k6/metrics';
import { buildStressMarkdown } from '../out/stress_stage_report.js';

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

const VALIDATION_PHASES = [
  { level: 'baseline_4', targetVUs: 4, startMs: 0, endMs: 5_000 },
  { level: 'anchor_8', targetVUs: 8, startMs: 0, endMs: 5_000 },
  { level: 'level_12', targetVUs: 12, startMs: 0, endMs: 5_000 },
  { level: 'level_16', targetVUs: 16, startMs: 0, endMs: 5_000 },
  { level: 'level_20', targetVUs: 20, startMs: 0, endMs: 5_000 },
  { level: 'maximum_24', targetVUs: 24, startMs: 0, endMs: 5_000 },
  { level: 'recovery_4', targetVUs: 4, startMs: 0, endMs: 5_000 },
];

const taggedTrend = new Trend('validation_tagged_trend_ms', true);
const directStageTrend = new Trend('validation_baseline_4_http_duration_ms', true);
const directStageRequests = new Counter('validation_baseline_4_http_requests');
const directStageChecks = new Rate('validation_baseline_4_checks');
const scenarioStartTimeAvailable = new Rate('validation_scenario_start_time_available');
const reportMetrics = {};
for (const phase of VALIDATION_PHASES) {
  const prefix = `stress_${phase.level}`;
  const stepLatency = {};
  const stepRequests = {};
  for (const step of STEPS) {
    stepLatency[step] = new Trend(`${prefix}_latency_${step}_ms`, true);
    stepRequests[step] = new Counter(`${prefix}_requests_${step}`);
  }
  reportMetrics[phase.level] = {
    httpDuration: new Trend(`${prefix}_http_duration_ms`, true),
    httpRequests: new Counter(`${prefix}_http_requests`),
    httpFailureRate: new Rate(`${prefix}_http_failure_rate`),
    checks: new Rate(`${prefix}_checks`),
    workflowSuccess: new Rate(`${prefix}_workflow_success`),
    workflowsCompleted: new Counter(`${prefix}_workflows_completed`),
    iterationDuration: new Trend(`${prefix}_iteration_duration_ms`, true),
    stepLatency,
    stepRequests,
  };
}

export const options = {
  scenarios: {
    validation: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 2,
      maxDuration: '5s',
    },
  },
  thresholds: {
    validation_baseline_4_checks: ['rate==1'],
  },
  summaryTrendStats: ['avg', 'min', 'p(50)', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const stressLevel = 'baseline_4';
  exec.vu.tags.stress_level = stressLevel;
  const value = 10 + exec.scenario.iterationInTest;

  taggedTrend.add(value, { stress_level: stressLevel });
  directStageTrend.add(value, { stress_level: stressLevel });
  directStageRequests.add(1, { stress_level: stressLevel });
  directStageChecks.add(true, { stress_level: stressLevel });
  scenarioStartTimeAvailable.add(typeof exec.scenario.startTime === 'number');

  for (let phaseIndex = 0; phaseIndex < VALIDATION_PHASES.length; phaseIndex += 1) {
    const phase = VALIDATION_PHASES[phaseIndex];
    const metrics = reportMetrics[phase.level];
    const tags = { stress_level: phase.level };
    metrics.httpDuration.add(10 + phaseIndex + exec.scenario.iterationInTest, tags);
    metrics.httpRequests.add(STEPS.length, tags);
    metrics.httpFailureRate.add(false, tags);
    metrics.checks.add(true, tags);
    metrics.workflowSuccess.add(true, tags);
    metrics.workflowsCompleted.add(1, tags);
    metrics.iterationDuration.add(13_000 + phaseIndex, tags);
    for (let stepIndex = 0; stepIndex < STEPS.length; stepIndex += 1) {
      const step = STEPS[stepIndex];
      const stepTags = { stress_level: phase.level, step };
      metrics.stepLatency[step].add(5 + stepIndex + phaseIndex, stepTags);
      metrics.stepRequests[step].add(1, stepTags);
    }
  }
}

export function handleSummary(data) {
  const previewPath = __ENV.VALIDATION_MARKDOWN_REPORT_PATH ||
    'work/stress-stage-metric-validation/official-report-preview.md';
  const metricKeys = Object.keys(data.metrics).sort();
  const taggedSubmetricKey = 'validation_tagged_trend_ms{stress_level:baseline_4}';
  const directMetric = data.metrics.validation_baseline_4_http_duration_ms;
  const requestMetric = data.metrics.validation_baseline_4_http_requests;
  const report = [
    '# k6 Stress Stage Metric Validation',
    '',
    `- Installed k6 exposed scenario start time: ${data.metrics.validation_scenario_start_time_available?.values?.rate === 1}`,
    `- Arbitrary tagged submetric materialized without an explicit threshold: ${metricKeys.includes(taggedSubmetricKey)}`,
    `- Direct stage Trend available: ${Boolean(directMetric)}`,
    `- Direct stage Counter available: ${Boolean(requestMetric)}`,
    `- Direct stage Trend p95: ${directMetric?.values?.['p(95)'] ?? 'missing'}`,
    `- Direct stage Counter count: ${requestMetric?.values?.count ?? 'missing'}`,
    `- Test run duration ms: ${data.state?.testRunDurationMs ?? 'missing'}`,
    '',
    '## Metric keys',
    '',
    ...metricKeys.map((key) => `- \`${key}\``),
    '',
  ].join('\n');

  const officialPreview = buildStressMarkdown(
    data,
    'validationrun01',
    VALIDATION_PHASES,
    STEPS,
  );
  const outputs = {
    'work/stress-stage-metric-validation/report.md': report,
    'work/stress-stage-metric-validation/handle-summary-data.json': JSON.stringify(data, null, 2),
    'work/stress-stage-metric-validation/official-report-preview.md': officialPreview,
    stdout: 'k6 stage-metric validation completed\n',
  };
  outputs[previewPath] = officialPreview;
  return outputs;
}
