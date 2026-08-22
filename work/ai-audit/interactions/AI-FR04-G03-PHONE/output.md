# AI output — FR-04 phone partitions

- P01 phone `0123456789` (10 digits, leading zero): valid boundary partition.
- P02 phone `01234567890` (11 digits, leading zero): valid boundary partition.
- P03 phone `012345678` (9 digits, leading zero): invalid length partition; rejection status is SPEC GAP.
- P04 phone `012345678901` (12 digits, leading zero): invalid length partition; rejection status is SPEC GAP.
- P05 phone `1123456789` (10 digits, no leading zero): invalid prefix partition; rejection status is SPEC GAP.
- P06 phone `012345678A` (non-digit character): invalid character partition; rejection status is SPEC GAP.
- P07 phone `+84123456789` (international format without leading zero): invalid documented format partition; rejection status is SPEC GAP.
