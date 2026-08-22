# Official Stress Visual Capture Instructions

Use `official_stress_gui_handoff.md` before starting official Stress traffic.

The required stages are `baseline_4`, `anchor_8`, `level_12`, `level_16`, `level_20`,
`maximum_24`, and `recovery_4`. The runner emits a live marker every ten seconds and
records the same stage label in process/system resource CSV rows.

Capture real desktop frames only while the corresponding stage is active. Each frame
must show the active runner/k6 context and backend resource usage together. Do not use
an after-the-fact screenshot, a reconstructed composition, or a screenshot from a
different run ID.

Hardware evidence is separate. Copy the verified hardware observation into the
invocation package and capture any assignment-required hardware screenshot on the same
machine.
