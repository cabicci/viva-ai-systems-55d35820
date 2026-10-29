# Architecture rules

- Live payment-risk handling resolves the Stripe charge/payment/invoice/subscription/customer graph before access changes; risk events require an atomic durable hold RPC and must fail non-2xx until that persistence prerequisite exists, never inventing financial refunds.