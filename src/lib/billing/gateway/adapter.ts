export interface GatewayCapabilities {
  createCustomer: boolean;
  createCheckoutSession: boolean;
  createSubscription: boolean;
  scheduleSubscriptionActivation: boolean;
  cancelAtPeriodEnd: boolean;
  upgradeImmediately: boolean;
  downgradeAtPeriodEnd: boolean;
  retrieveTransaction: boolean;
  issueRefund: boolean;
  retrieveRefund: boolean;
  verifyWebhook: boolean;
  normalizeWebhookEvent: boolean;
  listTransactionsForReconciliation: boolean;
}

export interface PaymentGatewayAdapter {
  readonly gatewayCode: "stripe_us" | "paymob_eg" | "future";
  readonly capabilities: GatewayCapabilities;
}

export function assertGatewayCapability(
  adapter: PaymentGatewayAdapter,
  capability: keyof GatewayCapabilities,
): void {
  if (!adapter.capabilities[capability]) {
    throw new Error(`OPERATION_NOT_SUPPORTED:${adapter.gatewayCode}:${capability}`);
  }
}

export const STRIPE_US_CAPABILITIES: GatewayCapabilities = {
  createCustomer: true,
  createCheckoutSession: true,
  createSubscription: true,
  scheduleSubscriptionActivation: true,
  cancelAtPeriodEnd: true,
  upgradeImmediately: true,
  downgradeAtPeriodEnd: true,
  retrieveTransaction: true,
  issueRefund: true,
  retrieveRefund: true,
  verifyWebhook: true,
  normalizeWebhookEvent: true,
  listTransactionsForReconciliation: true,
};

export const PAYMOB_EG_CAPABILITIES: GatewayCapabilities = {
  createCustomer: false,
  createCheckoutSession: false,
  createSubscription: false,
  scheduleSubscriptionActivation: false,
  cancelAtPeriodEnd: false,
  upgradeImmediately: false,
  downgradeAtPeriodEnd: false,
  retrieveTransaction: false,
  issueRefund: false,
  retrieveRefund: false,
  verifyWebhook: false,
  normalizeWebhookEvent: false,
  listTransactionsForReconciliation: false,
};
