import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { resolveStripeRefund } from "../../../../supabase/functions/_shared/stripe-refunds";

function fixture() {
  const objects: Record<string, any> = {
    "/refunds/re_test": { id:"re_test",livemode:false,payment_intent:"pi_test",status:"succeeded",amount:5000,currency:"egp" },
    "/invoices/in_test": { id:"in_test",livemode:false,customer:"cus_test",status:"paid",amount_paid:16900,currency:"egp",
      parent:{subscription_details:{subscription:"sub_test"}} },
    "/subscriptions/sub_test": { id:"sub_test",livemode:false,customer:"cus_test",latest_invoice:"in_test",
      metadata:{internal_subscription_id:"internal",user_id:"owner",checkout_generation:"generation"} },
    "/payment_intents/pi_test": { id:"pi_test",livemode:false,customer:"cus_test",status:"succeeded",amount_received:16900,currency:"egp" },
    payments:{ has_more:false,data:[{ livemode:false,status:"paid",invoice:"in_test",currency:"egp",amount_paid:16900,
      payment:{type:"payment_intent",payment_intent:"pi_test"} }] },
  };
  const paths:string[]=[];
  const get=async(path:string)=>{
    paths.push(path);
    if(path.startsWith("/invoice_payments?")) {
      const query=new URLSearchParams(path.split("?")[1]);
      expect(query.get("payment[type]")).toBe("payment_intent");
      expect(query.get("payment[payment_intent]")).toBe("pi_test");
      return objects.payments;
    }
    if(!objects[path]) throw new Error("UNEXPECTED_PATH:"+path);
    return objects[path];
  };
  return {objects,get,paths};
}
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
describe("Stripe refund authoritative invoice correlation",()=>{
  it("uses provider relations and current refund status, not supplied metadata",async()=>{
    const {objects,get}=fixture();
    objects["/refunds/re_test"].metadata={invoice_id:"in_wrong",user_id:"wrong"};
    expect((await resolveStripeRefund("re_test",get))?.rpc).toMatchObject({
      p_gateway_invoice_id:"in_test",p_amount_minor:5000,p_is_latest_invoice:true,p_status:"succeeded",
    });
  });
  it("supports charge-linked refunds and flags old invoices",async()=>{
    const {objects,get}=fixture();
    objects["/refunds/re_test"].payment_intent=null;
    objects["/refunds/re_test"].charge="ch_test";
    objects["/charges/ch_test"]={livemode:false,payment_intent:"pi_test"};
    objects["/subscriptions/sub_test"].latest_invoice="in_newer";
    expect((await resolveStripeRefund("re_test",get))?.rpc.p_is_latest_invoice).toBe(false);
  });
  it.each(["refund","invoice","subscription","intent"])("rejects Live %s data",async(kind)=>{
    const {objects,get}=fixture();
    const paths={refund:"/refunds/re_test",invoice:"/invoices/in_test",subscription:"/subscriptions/sub_test",intent:"/payment_intents/pi_test"};
    objects[paths[kind as keyof typeof paths]].livemode=true;
    await expect(resolveStripeRefund("re_test",get)).rejects.toThrow();
  });
  it("rejects incomplete and ambiguous invoice allocation",async()=>{
    const {objects,get}=fixture();
    objects.payments.has_more=true;
    await expect(resolveStripeRefund("re_test",get)).rejects.toThrow("INCOMPLETE");
    objects.payments.has_more=false;
    objects.payments.data.push({...objects.payments.data[0],invoice:"in_other"});
    await expect(resolveStripeRefund("re_test",get)).rejects.toThrow("AMBIGUOUS");
  });
  it.each(["currency","customer","amount"])("rejects mismatched %s evidence",async(kind)=>{
    const {objects,get}=fixture();
    if(kind==="currency") objects["/invoices/in_test"].currency="usd";
    if(kind==="customer") objects["/payment_intents/pi_test"].customer="cus_other";
    if(kind==="amount") objects["/payment_intents/pi_test"].amount_received=17000;
    await expect(resolveStripeRefund("re_test",get)).rejects.toThrow("MISMATCH");
  });
  it("ignores unrelated non-invoice payments",async()=>{
    const {objects,get}=fixture(); objects.payments.data=[];
    expect(await resolveStripeRefund("re_test",get)).toBeNull();
  });
  it.each([false,true])("cancels only after the database proves a current full refund: %s",async(cancel)=>{
    const {get}=fixture();
    let handler!:(request:Request)=>Promise<Response>;
    const deleted:string[]=[];
    vi.stubGlobal("Deno",{serve:(fn:typeof handler)=>{handler=fn;},env:{get:(name:string)=>
      name==="STRIPE_SECRET_KEY"?"rk_test_fixture":name==="STRIPE_WEBHOOK_SECRET"?"whsec_fixture":"https://db.example.test"}});
    vi.stubGlobal("fetch",vi.fn(async(url:string,options:RequestInit)=>{
      if(url.includes("/rpc/apply_stripe_refund_event")) {
        expect(JSON.parse(String(options.body))).toMatchObject({p_gateway_invoice_id:"in_test",p_gateway_event_id:"evt_signed"});
        return new Response(JSON.stringify({processed:true,cancel_subscription:cancel}));
      }
      if(options.method==="DELETE") {deleted.push(url);return new Response(JSON.stringify({status:"canceled"}));}
      return new Response(JSON.stringify(await get(url.replace("https://api.stripe.com/v1",""))));
    }));
    const entrypoint="../../../../supabase/functions/billing-stripe-webhook/index.ts";
    await import(entrypoint);
    const time=Math.floor(Date.now()/1000);
    const body=JSON.stringify({id:"evt_signed",type:"refund.created",created:time,livemode:false,data:{object:{id:"re_test"}}});
    const signature=createHmac("sha256","whsec_fixture").update(`${time}.${body}`).digest("hex");
    const response=await handler(new Request("https://test.local/webhook",{method:"POST",body,headers:{"Stripe-Signature":`t=${time},v1=${signature}`}}));
    expect(response.status).toBe(200);
    expect(deleted).toEqual(cancel?["https://api.stripe.com/v1/subscriptions/sub_test?invoice_now=false&prorate=false"]:[]);
  });
});
