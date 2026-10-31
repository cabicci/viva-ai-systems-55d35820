/** The explicit disposable CI database is plain loopback Postgres.
 * Every other schema-read connection retains the existing TLS requirement.
 */
export function billingSchemaReadSsl(environment: {
  BILLING_DISPOSABLE_DB?: string;
  PGHOST?: string;
}): false | "require" {
  return environment.BILLING_DISPOSABLE_DB === "1" && environment.PGHOST === "127.0.0.1"
    ? false
    : "require";
}
