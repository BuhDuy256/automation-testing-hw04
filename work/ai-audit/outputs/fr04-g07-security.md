# AI output — FR-04 security exploration

- X01 store an HTML-like profile name/address, then inspect the consuming profile UI for escaped output; API rejection is not required by SEC-04.
- X02 store a harmless quote/apostrophe string in name/address and read it back; check persistence integrity; no internal query conclusion from black-box output.
- X03 submit SQL-like text in name/address and read the profile back; use as SEC-05 robustness exploration; a safe response does not prove parameterization.
- X04 submit a role-tampering payload and compare persisted role with the baseline; SEC-06 invariant, no confirmed bug claim.
