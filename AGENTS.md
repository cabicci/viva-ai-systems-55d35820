# Architecture rules

- Live payment-risk handling validates the Stripe payment graph and uses service-only atomic holds in the existing LC09-classified webhook ledger; Live writers share lifecycle/user locks, access guards prevent restoration, and ordinary events never release a hold or invent refunds.
- Package payment attribution uses a shared presentation-only locale-aware component; selected-method attribution is rendered by PaymentMethods only for non-complimentary Stripe checkout so manual transfers are not attributed to Stripe.
- The read-only billing mode endpoint shares one server-only handler between its file route and exact-path Worker-entry dispatch; this avoids hosted file-route dispatch gaps without bypassing guards on any Live or private endpoint.