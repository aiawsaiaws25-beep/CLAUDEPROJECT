# AP Review Item Triage Guide (OPS-GDE-004, v1.4, sandbox training copy)

## 1. When to raise a review item

Raise one review item per invoice that has at least one exception under FIN-POL-007 or FIN-STD-012. Do not raise items for invoices that pass all checks.

## 2. Severity

High: bank detail mismatch, blocked vendor, possible duplicate, or invoice total above AED 250,000.

Medium: price variance exception, quantity mismatch, or new-vendor invoice.

Low: No-PO exception under AED 5,000 or documentation gaps only.

## 3. Required fields

title: short description, e.g. 'Price variance - INV-10442 - Gulf Office Supplies'.

invoiceNumber, vendorName, amountAED.

exceptionType: one of NoPO, QuantityMismatch, PriceVariance, PossibleDuplicate, BankDetailMismatch, NewVendor, BlockedVendor.

severity: High, Medium, or Low per section 2.

evidence: at least one item with the source document name and the clause or excerpt relied on.

recommendedAction: what the reviewer should check or decide.

## 4. Service levels

High: reviewer assigned within 4 business hours. Medium: 1 business day. Low: 3 business days.

## 5. Agent rules

An AI agent may draft and create review items in the sandbox queue but must never approve, reject, or release a payment.

The agent must confirm the details with the user before creating a review item.
