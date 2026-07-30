---
title: Merchants
---

# Merchants

Merchants publish advertisements, manage reservations and settlements, and
monitor analytics through the OpenFiat web application,
[openfiat-app](https://github.com/OpenFiat-org/openfiat-app) — merchant
profiles, the post-advertisement wizard and the trade room live there.

That app is being cut over from simulated demo data to live data one route at
a time, and the merchant flows are among the routes still rendering demo data.
Treat what you see there as the intended shape rather than as your own book.
The node-side surface underneath it — `sendAdvertisementCreate`,
`sendAdvertisementPriceUpdate`, `sendAdvertisementDisable`, and the
reservation and settlement methods — is real today and documented in the
[API reference](../api).

The older `openfiat-apps/merchant` scaffold is no longer under active
development; new frontend work is concentrated in `openfiat-app`.

This section will cover onboarding, advertisement best practices, dispute
handling, and settlement reconciliation as those flows move onto live data.
