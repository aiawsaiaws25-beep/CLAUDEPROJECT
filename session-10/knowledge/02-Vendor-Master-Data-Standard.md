# Contoso Vendor Master Data Standard (FIN-STD-012, v2.0, sandbox training copy)

## 1. Scope

Applies to creating and changing supplier records, including bank account details.

## 2. Bank detail changes

Any change to a supplier's bank account must be verified by a call-back to a phone number already on file (not one supplied in the change request).

Payments to a newly changed bank account are held for 5 business days after verification.

An invoice that references bank details different from the vendor master is a 'Bank detail mismatch exception' and is always High severity because it is a common fraud pattern.

## 3. New vendors

A vendor created less than 30 days ago is flagged 'New vendor'. Its first three invoices require AP Review regardless of amount.

## 4. Blocked vendors

Invoices from a vendor with status 'Blocked' must not be paid. Raise a review item and notify Procurement.
