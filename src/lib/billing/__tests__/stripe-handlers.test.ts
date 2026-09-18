import { afterEach, describe, expect, it, vi } from 'vitest';

// Runtime-loaded Deno entrypoints are tested with a captured Deno.serve boundary.
// Keep Deno globals out of the frontend TypeScript program.
const checkoutModule = '../../../../supabase/functions/billing-stripe-checkout/index.ts';
const webhookModule = '../../../../supabase/functions/billing-stripe-webhook/index.ts';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('Stripe deployed handler boundaries', () => {
  it('rejects missing Checkout auth without contacting the provider', async () => {
    let handler!: (request: Request) => Promise<Response>;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('Deno', { serve: (fn: typeof handler) => { handler = fn; }, env: { get: () => 'test' } });
    await import(checkoutModule);
    const response = await handler(new Request('https://test.local/checkout', { method: 'POST' }));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks a new Checkout while a Stripe subscription is active', async () => {
    let handler!: (request: Request) => Promise<Response>;
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(String(url));
      const data = String(url).endsWith('/auth/v1/user') ? { id: 'owner', email: 'owner@example.test' }
        : String(url).includes('get_stripe_checkout_context') ? {
          access_state: 'free_active', gateway_price_id: 'price_pro', gateway_product_id: 'prod_pro',
          gateway_customer_id: 'cus_owner',
        } : String(url).includes('/subscriptions?') ? {
          data: [{ id: 'sub_existing', status: 'active', metadata: { environment: 'test' } }],
        } : null;
      if (!data) throw new Error('Unexpected network call: ' + url);
      return new Response(JSON.stringify(data));
    }));
    vi.stubGlobal('Deno', { serve: (fn: typeof handler) => { handler = fn; }, env: {
      get: (key: string) => key === 'STRIPE_SECRET_KEY' ? 'sk_test_fixture_only' : 'https://db.example.test',
    } });
    await import(checkoutModule);
    const response = await handler(new Request('https://test.local/checkout', {
      method: 'POST', headers: { Authorization: 'Bearer fixture' },
      body: JSON.stringify({ planKey: 'pro', billingInterval: 'month', marketCode: 'EG' }),
    }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'SUBSCRIPTION_ALREADY_MANAGED' });
    expect(calls.some(url => url.includes('/checkout/sessions') || url.includes('prepare_stripe_checkout'))).toBe(false);
  });

  it('rejects an unsigned webhook before any RPC or Stripe request', async () => {
    let handler!: (request: Request) => Promise<Response>;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('Deno', { serve: (fn: typeof handler) => { handler = fn; }, env: { get: () => 'whsec_fixture_only' } });
    await import(webhookModule);
    const response = await handler(new Request('https://test.local/webhook', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'INVALID_SIGNATURE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
