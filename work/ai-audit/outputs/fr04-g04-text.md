# AI output — FR-04 text fields

- T01 ordinary ASCII name and address with valid phone; supported text partition.
- T02 Vietnamese Unicode name and address with valid phone; supported text partition, exact response is SPEC GAP.
- T03 empty name with otherwise valid fields; exploratory because requiredness is undocumented; do not require a status.
- T04 null shipping_address with otherwise valid fields; robustness case; nullability and status are SPEC GAP.
- T05 numeric name and array shipping_address; wrong-type robustness case; status is SPEC GAP.
- T06 very long name and address; robustness case because no length limit is documented; status is SPEC GAP.
- T07 HTML-like name/address such as `<b>Lan</b>`; SEC-04 storage/display safety exploration, not an automatic rejection expectation.
