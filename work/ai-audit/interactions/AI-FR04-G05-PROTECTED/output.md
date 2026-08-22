# AI output — FR-04 protected fields

- R01 submit a different `email` with valid editable fields; verify the persisted email remains the baseline email; exact handling of the extra field is SPEC GAP.
- R02 submit `role: "admin"` with valid editable fields; verify persisted role remains unchanged; SEC-06 invariant, exact handling is SPEC GAP.
- R03 submit both changed `email` and `role`; verify neither protected field changes; exact status/body is SPEC GAP.
- R04 submit protected fields with wrong types; verify no protected-field mutation; request handling is exploratory and status is SPEC GAP.
