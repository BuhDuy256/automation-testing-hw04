# AI output — FR-04 schema and request shape

- Z01 send a valid JSON object with all three documented editable strings; verify the read-back contains the editable profile fields; response schema is otherwise SPEC GAP.
- Z02 send `{}`; requiredness and status are unspecified, so record as schema exploration rather than a mandatory 400 case.
- Z03 send a JSON array instead of an object; wrong-shape robustness case; status/schema is SPEC GAP.
- Z04 send valid editable fields plus an unrelated `unexpected` property; observe whether it is ignored/rejected without treating either as documented.
- Z05 send malformed JSON with the correct content type; parser robustness case; exact status is SPEC GAP.
