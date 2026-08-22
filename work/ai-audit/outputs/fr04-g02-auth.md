# AI output — FR-04 authentication

- A01 omit Authorization; update otherwise valid profile; SEC-02 requires a valid JWT, failure status/schema is SPEC GAP.
- A02 send `Authorization: Basic ...`; SEC-02 basis, exact failure status is SPEC GAP.
- A03 send `Authorization: Bearer` with no token; SEC-02 basis, exact failure status is SPEC GAP.
- A04 send a syntactically JWT-like but invalid-signature token; SEC-02 basis, exact failure status is SPEC GAP.
- A05 send an expired JWT; SEC-02 basis, exact failure status is SPEC GAP.
- A06 send a valid user JWT and verify the update affects only that user; contract/state basis.
