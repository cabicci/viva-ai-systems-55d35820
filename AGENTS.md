# Architecture rules

- Live payment-risk handling resolves the Stripe charge/payment/invoice/subscription/customer graph before access changes; persist a subscription risk marker and enforce it on later fulfillment to prevent automatic restoration without inventing financial refunds.