# Performance Testing Skill Extraction Note

## Purpose

This note records which proven lessons from the completed Load lifecycle were generalized into `performance-testing-lifecycle`. Current EShop identifiers and measured numbers remain outside the generic skill.

## Authoritative extraction sources

- HW05 requirements: `docs/hw05-req/2026.HW05.Performance Testing_En_2.0_HTThanh.md`
- Runtime workflow contract: `work/workflow1_runtime_contract.md`
- CSV design: `work/csv_test_data_design.md`
- Calibration: `work/load_test_calibration.md`
- Human-reviewed plan: `work/load_test_plan_design.md`
- Approved implementation: `out/23127179_Load_20260817.js`
- First execution: `out/23127179_Load_20260817_evidence/20260817t042311622/official-load-execution-report.md`
- Primary run: `out/23127179_Load_20260817_evidence/20260817t045341487/second-run-completion-report.md` and `screenshot-manifest.md`
- GUI coordination: `work/official_load_second_run_gui_handoff.md`

## Generalized lessons

- Separate requirements, runtime facts, measurements, AI proposals, synthetic assumptions, and human decisions.
- Verify semantic success and runtime correlation before adding concurrency.
- Keep CSV limited to controlled inputs and isolate persistent state.
- Calibrate Load parameters when no production model exists; do not disguise convenient numbers as empirical laws.
- Freeze the human-reviewed plan before implementation and execution.
- Treat threshold failures as valid evidence and avoid automatic clean reruns.
- Prepare raw output, monitoring, report export, and GUI capture before traffic.
- Preserve technically valid but submission-incomplete invocations.
- Attribute screenshots using active state, run identity, timestamps, and process IDs.
- Treat Windows UAC/integrity restrictions as an evidence constraint requiring minimal human assistance, not a test defect.
- Keep designated report types distinct while allowing common raw evidence across scenarios.
- Analyze raw results first and classify optimization advice by implementation support.

## Load lifecycle verification used for extraction

The second invocation `20260817t045341487` is the primary Load submission-evidence run. Repository evidence confirms 94 completed workflows, 846 HTTP requests, nine tagged requests per workflow, zero interrupted iterations, zero HTTP failures, complete semantic/workflow success, process and system resource coverage, a native k6 Web Dashboard HTML export, and real same-run GUI screenshots. The first invocation `20260817t042311622` remains technically valid but submission-incomplete because it lacks the required same-run GUI screenshot.
