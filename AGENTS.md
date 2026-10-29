# Architecture rules

- Live payment-risk handling validates the Stripe payment graph and uses service-only atomic holds in the existing LC09-classified webhook ledger; Live writers share lifecycle/user locks, access guards prevent restoration, and ordinary events never release a hold or invent refunds.