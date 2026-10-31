/** Local, per-instance read fencing. Supplied verification is an external trust boundary,
 * not an authentication service. No transport, storage, React or clock is used here. */
export type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
export type JsonObject = { readonly [key: string]: Json };
export type Subject = Readonly<{ kind: "auth_user" | "kids_profile"; id: string }>;
export type PersonalContext = Readonly<{ kind: "personal"; organization_id: null }>;
export type LocalContext = Readonly<{
  backend: string;
  actor_user_id: string;
  subject: Subject;
  context: PersonalContext;
}>;
export const READ_METHODS = Object.freeze([
  "read_journey_snapshot", "read_journey_page", "read_journey_watermarks", "read_resume_cursor",
  "read_draft", "read_attempt_state", "read_attempt_material", "read_official_result",
] as const);
export type ReadMethod = (typeof READ_METHODS)[number];
export type ReadRequest = Readonly<{
  contract_version: "masarat-foundation-read-v1-candidate1";
  read_revision: 1;
  method: ReadMethod;
  request_id: string;
  subject: Subject;
  context: PersonalContext;
  ui_locale: "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
  filters: JsonObject;
  evidence: JsonObject;
  payload: JsonObject;
}>;
export type ServerBinding = Readonly<{
  backend_namespace: string;
  actor_user_id: string;
  subject: Subject;
  context: PersonalContext;
  permission_epoch: string;
  scope_sha256: string;
}>;
export type CursorChain = ServerBinding & Readonly<{
  cursor: string;
  snapshot_id: string;
  projection_version: string;
  projection_generation: string;
  filter_sha256: string;
  source_watermarks_sha256: string;
  stable_sort_version: string;
}>;
export type ReadOptions = Readonly<{ filter_sha256: string; cursor_chain?: CursorChain }>;
declare const ticketBrand: unique symbol;
/** Identity is checked in the issuing instance's WeakMap, never by public fields. */
export type ReadTicket = Readonly<{ [ticketBrand]: true }>;
export type ContextSnapshot = Readonly<{
  context: LocalContext;
  root_generation: number;
  auth_generation: number;
  permission_generation: number;
  mode: "bootstrap" | "stable" | "blocked" | "refreshing";
  server_binding: ServerBinding | null;
}>;
export type TicketInfo = Readonly<{
  slot: string;
  request_generation: number;
  captured: ContextSnapshot;
  request: ReadRequest;
  options: ReadOptions;
  view_scope: string;
}>;

/** Clone JSON data via descriptors: no accessors, thenables, functions, prototypes,
 * symbols, sparse arrays or caller-held mutable references enter the ledger. */
export function immutableJson<T>(input: T): T {
  const ancestors = new Set<object>();
  const copy = (value: unknown): Json => {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "object" || value === null) throw new TypeError("Expected JSON data");
    if (ancestors.has(value)) throw new TypeError("Cyclic data");
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null && proto !== Array.prototype)
      throw new TypeError("Expected plain JSON data");
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.getOwnPropertySymbols(value).length) throw new TypeError("Symbol data");
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const length = descriptors.length.value as number;
        if (Object.keys(descriptors).length !== length + 1) throw new TypeError("Non-JSON array");
        const result: Json[] = [];
        for (let i = 0; i < length; i++) {
          const d = descriptors[String(i)];
          if (!d || !("value" in d) || !d.enumerable) throw new TypeError("Sparse/accessor array");
          result.push(copy(d.value));
        }
        return Object.freeze(result);
      }
      if (proto === Array.prototype) throw new TypeError("Invalid object prototype");
      const result: Record<string, Json> = Object.create(null);
      for (const [key, d] of Object.entries(descriptors)) {
        if (!("value" in d) || !d.enumerable) throw new TypeError("Accessor/hidden data");
        result[key] = copy(d.value);
      }
      return Object.freeze(result);
    } finally { ancestors.delete(value); }
  };
  return copy(input) as T;
}
export function jsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Expected object");
  return value as JsonObject;
}
export function exactKeys(value: object, allowed: readonly string[], required = allowed): void {
  const keys = Reflect.ownKeys(value);
  if (keys.some(k => typeof k !== "string" || !allowed.includes(k)) ||
      required.some(k => !Object.prototype.hasOwnProperty.call(value, k))) throw new TypeError("Unexpected/missing fields");
}
function text(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function validSubject(value: Subject): boolean {
  exactKeys(value, ["kind", "id"]);
  return (value.kind === "auth_user" || value.kind === "kids_profile") && text(value.id);
}
function validPersonal(value: PersonalContext): boolean {
  exactKeys(value, ["kind", "organization_id"]);
  return value.kind === "personal" && value.organization_id === null;
}
export function sameSubject(a: Subject, b: Subject): boolean { return a.kind === b.kind && a.id === b.id; }
function next(n: number): number {
  if (n >= Number.MAX_SAFE_INTEGER) throw new RangeError("Generation exhausted");
  return n + 1;
}
function stable(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable((value as JsonObject)[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
function localCopy(value: LocalContext): LocalContext {
  const c = immutableJson(value);
  exactKeys(c, ["backend", "actor_user_id", "subject", "context"]);
  if (!text(c.backend) || !text(c.actor_user_id) || !validSubject(c.subject) || !validPersonal(c.context))
    throw new TypeError("Invalid local context");
  return c;
}
type RecordState = { info: TicketInfo; settled: boolean };

class ContextLedger {
  #context: LocalContext;
  #root = 0;
  #auth = 0;
  #permission = 0;
  #mode: ContextSnapshot["mode"] = "bootstrap";
  #server: ServerBinding | null = null;
  #slots = new Map<string, { generation: number; ticket: ReadTicket }>();
  #tickets = new WeakMap<object, RecordState>();
  constructor(context: LocalContext) { this.#context = localCopy(context); Object.freeze(this); }
  static genuine(value: unknown): value is ContextLedger {
    return typeof value === "object" && value !== null && #tickets in value;
  }
  snapshot(): ContextSnapshot {
    return Object.freeze({ context: this.#context, root_generation: this.#root,
      auth_generation: this.#auth, permission_generation: this.#permission,
      mode: this.#mode, server_binding: this.#server });
  }
  /** A supplied auth boundary is fresh even when all UUIDs are unchanged. UI locale is not a boundary. */
  replaceContext(context: LocalContext): void {
    const root = this.#root;
    const c = localCopy(context);
    if (root !== this.#root) throw new Error("Reentrant context change");
    const r = next(this.#root), a = next(this.#auth), p = next(this.#permission);
    this.#context = c; this.#root = r; this.#auth = a; this.#permission = p;
    this.#mode = "bootstrap"; this.#server = null;
  }
  beginRead(slot: string, request: ReadRequest, options: ReadOptions): ReadTicket {
    if (!text(slot) || this.#mode === "blocked") throw new Error("Read scope is blocked/invalid");
    const captured = this.snapshot();
    const r = immutableJson(request), o = immutableJson(options);
    exactKeys(r, ["contract_version", "read_revision", "method", "request_id", "subject", "context", "ui_locale", "filters", "evidence", "payload"]);
    exactKeys(o, ["filter_sha256", "cursor_chain"], ["filter_sha256"]);
    if (r.contract_version !== "masarat-foundation-read-v1-candidate1" || r.read_revision !== 1 ||
        !READ_METHODS.includes(r.method) || !text(r.request_id) ||
        !["ar-EG", "ar-MSA", "ar-Gulf", "en"].includes(r.ui_locale) ||
        !validSubject(r.subject) || !validPersonal(r.context) || !sameSubject(r.subject, this.#context.subject) ||
        !text(o.filter_sha256)) throw new TypeError("Invalid/cross-context read");
    jsonObject(r.filters); jsonObject(r.evidence); jsonObject(r.payload);
    if (captured.root_generation !== this.#root) throw new Error("Reentrant read capture");
    const generation = next(this.#slots.get(slot)?.generation ?? 0);
    const ticket = Object.freeze(Object.create(null)) as ReadTicket;
    const family = r.method === "read_journey_page" ? "read_journey_snapshot" : r.method;
    const target = family === "read_journey_snapshot" ? null : r.payload;
    const info = Object.freeze({ slot, request_generation: generation, captured, request: r, options: o,
      view_scope: stable([family, o.filter_sha256, target]) });
    this.#tickets.set(ticket, { info, settled: false });
    this.#slots.set(slot, { generation, ticket });
    return ticket;
  }
  inspectTicket(ticket: unknown): TicketInfo | null {
    return typeof ticket === "object" && ticket !== null ? this.#tickets.get(ticket)?.info ?? null : null;
  }
  currentRequest(slot: string): TicketInfo | null {
    const token = this.#slots.get(slot)?.ticket;
    const info = token ? this.inspectTicket(token) : null;
    return info?.captured.root_generation === this.#root ? info : null;
  }
  isCurrent(ticket: unknown): ticket is ReadTicket {
    if (typeof ticket !== "object" || ticket === null || this.#mode === "blocked") return false;
    const r = this.#tickets.get(ticket);
    if (!r || r.settled) return false;
    return r.info.captured.root_generation === this.#root &&
      r.info.captured.auth_generation === this.#auth && r.info.captured.permission_generation === this.#permission &&
      this.#slots.get(r.info.slot)?.ticket === ticket;
  }
  retireRead(ticket: ReadTicket): boolean {
    if (!this.isCurrent(ticket)) return false;
    this.#tickets.get(ticket)!.settled = true;
    return true;
  }
  /** No ticket means an explicit trusted local lifecycle event, never a response shortcut. */
  observeRevocation(ticket?: ReadTicket): boolean {
    if (ticket !== undefined && !this.isCurrent(ticket)) return false;
    const r = next(this.#root), p = next(this.#permission);
    this.#root = r; this.#permission = p; this.#server = null; this.#mode = "blocked";
    return true;
  }
  beginReauthorization(): void {
    const r = next(this.#root), p = next(this.#permission);
    this.#root = r; this.#permission = p; this.#server = null; this.#mode = "refreshing";
  }
  /** The verifier must bind this response to the real current transport/authority externally. */
  bindObservedServerContext(ticket: ReadTicket, supplied: ServerBinding, verified: boolean):
    "bound" | "unchanged" | "mismatch" | "dropped" | "gated" {
    if (!this.isCurrent(ticket)) return "dropped";
    if (verified !== true) return "gated";
    let b: ServerBinding;
    try {
      const s = immutableJson(supplied);
      b = immutableJson({ backend_namespace: s.backend_namespace, actor_user_id: s.actor_user_id,
        subject: s.subject, context: s.context, permission_epoch: s.permission_epoch, scope_sha256: s.scope_sha256 });
      if (!text(b.backend_namespace) || !text(b.permission_epoch) || !text(b.scope_sha256) ||
          b.actor_user_id !== this.#context.actor_user_id || !validSubject(b.subject) ||
          !sameSubject(b.subject, this.#context.subject) || !validPersonal(b.context)) return "gated";
    } catch { return "gated"; }
    if (!this.isCurrent(ticket)) return "dropped";
    if (this.#server && (this.#server.backend_namespace !== b.backend_namespace ||
        this.#server.permission_epoch !== b.permission_epoch || this.#server.scope_sha256 !== b.scope_sha256)) {
      this.observeRevocation(ticket); return "mismatch";
    }
    if (this.#server) return "unchanged";
    this.#server = b; this.#mode = "stable";
    return "bound";
  }
}
Object.freeze(ContextLedger.prototype);
export type ReadContextLedger = ContextLedger;
export function createReadContextLedger(context: LocalContext): ReadContextLedger { return new ContextLedger(context); }
export function isReadContextLedger(value: unknown): value is ReadContextLedger { return ContextLedger.genuine(value); }
