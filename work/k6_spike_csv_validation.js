import { sleep } from 'k6';
import exec from 'k6/execution';
import { Counter, Rate, Trend } from 'k6/metrics';

const fixtureLatency = new Trend('fixture_spike_latency_ms', true);
const fixtureRequests = new Counter('fixture_spike_requests');
const fixtureChecks = new Rate('fixture_spike_checks');

export const options = {
  scenarios: {
    csv_validation: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1s', target: 2 },
        { duration: '1s', target: 2 },
        { duration: '1s', target: 1 },
      ],
      gracefulRampDown: '1s',
      gracefulStop: '1s',
    },
  },
  summaryTrendStats: ['avg', 'min', 'p(50)', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const phase = exec.scenario.iterationInTest % 2 === 0
    ? 'pre_spike_steady_4'
    : 'spike_peak_32';
  const tags = {
    step: 'checkout',
    spike_phase: phase,
    target_vus: phase === 'spike_peak_32' ? '32' : '4',
  };

  exec.vu.tags.spike_phase = phase;
  exec.vu.tags.target_vus = tags.target_vus;
  fixtureLatency.add(10 + exec.scenario.iterationInTest, tags);
  fixtureRequests.add(1, tags);
  fixtureChecks.add(true, tags);
  sleep(0.05);
}
