import { describe, expect, it } from "vitest";
import { billingSchemaReadSsl } from "./billing-schema-ssl";

describe("applied-schema read connection TLS", () => {
  it("uses plain transport only for the explicitly marked disposable IPv4 loopback", () => {
    expect(billingSchemaReadSsl({ BILLING_DISPOSABLE_DB: "1", PGHOST: "127.0.0.1" })).toBe(false);
  });
  it.each([
    {},
    { PGHOST: "127.0.0.1" },
    { BILLING_DISPOSABLE_DB: "0", PGHOST: "127.0.0.1" },
    { BILLING_DISPOSABLE_DB: "1", PGHOST: "database.example.test" },
    { BILLING_DISPOSABLE_DB: "1", PGHOST: "127.0.0.1.example.test" },
  ])("keeps TLS required outside that exact disposable target: %j", (environment) => {
    expect(billingSchemaReadSsl(environment)).toBe("require");
  });
});
