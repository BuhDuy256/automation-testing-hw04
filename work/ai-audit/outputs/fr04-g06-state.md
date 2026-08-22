# AI output — FR-04 persistence and state

- S01 capture baseline, update all editable fields, GET the profile, and verify the new values persist.
- S02 update only phone with valid boundary value, GET the profile, and verify name/address remain baseline if omission preserves them; omission semantics are SPEC GAP.
- S03 update name/address/phone to profile V2, then update to distinct profile V3 and GET; verify the final state is V3, not V2.
- S04 restore the captured baseline after a mutation and GET; verify test cleanup restores the original profile.
- S05 attempt update with an unauthenticated request and then GET using a valid session; verify the baseline profile was not changed; failure status is SPEC GAP.
