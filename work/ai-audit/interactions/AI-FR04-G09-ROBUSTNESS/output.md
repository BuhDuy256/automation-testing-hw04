# AI output — FR-04 robustness

- B01 combine the shortest valid phone with Unicode name/address; verify the valid phone contract and inspect text persistence.
- B02 combine the longest valid phone with empty name/address; exploratory because text requiredness is unknown.
- B03 combine an invalid 9-digit phone with wrong-type name; negative robustness case; exact status is SPEC GAP.
- B04 repeat the same valid update twice and GET; verify idempotent final profile state, while exact response behavior remains SPEC GAP.
- B05 send a body containing duplicate JSON keys for `phone`; parser behavior is exploratory and must be observed, not assumed.
