import type { SupportedLocale } from "@/lib/locale/types";

export type QuizAction = "quiz" | "reset_quiz";
export type QuizCommand = { requestId: string; actorId: string; expectedRevision: number };
export type QuizReceipt = { requestId: string; appliedRevision: number; currentRevision: number; replayed: boolean };
export type QuizIntent = { action: QuizAction; lessonId: string; locale: SupportedLocale; data: Record<string, unknown>; _technicalCommand: QuizCommand };
export type QuizCommandResult = { allowed: boolean; command: QuizReceipt };
export type IntentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validQuizRevision = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
export class TechnicalCommandError extends Error {
  constructor(readonly code: string) { super(code); this.name = "TechnicalCommandError"; }
}
const definitive = new Set(["TECHNICAL_COMMAND_CONFLICT", "TECHNICAL_COMMAND_ACTOR_MISMATCH", "TECHNICAL_COMMAND_INVALID", "TECHNICAL_COMMAND_REQUIRED", "LEARNING_REQUEST_MISMATCH"]);
function stable(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stable((value as Record<string,unknown>)[k])).join(",") + "}";
  return JSON.stringify(value);
}
export function validQuizIntent(value: unknown, actorId: string, lessonId: string): value is QuizIntent {
  const i = value as QuizIntent | null;
  return !!i && ["quiz", "reset_quiz"].includes(i.action) && i.lessonId === lessonId &&
    ["en", "ar-EG", "ar-MSA", "ar-Gulf"].includes(i.locale) && !!i.data && typeof i.data === "object" && !Array.isArray(i.data) &&
    !("_technicalCommand" in i.data) && !!i._technicalCommand && uuid.test(i._technicalCommand.requestId) &&
    uuid.test(actorId) && i._technicalCommand.actorId === actorId && validQuizRevision(i._technicalCommand.expectedRevision);
}
/** One browser-tab journal per account/lesson (all locales), never a grade cache.
 * Every dispatched intent is persisted before transport. Replays keep its exact
 * UUID/payload/revision; cross-tab safety is supplied by the server revision CAS.
 */
export class QuizCommandLane {
  private tail: Promise<unknown> = Promise.resolve();
  private revision: number | null = null;
  private pending: QuizIntent | null = null;
  private blocked = false;
  private loaded = false;
  private corrupt = false;
  private readonly key: string;
  constructor(private readonly options: {
    actorId: string; lessonId: string; storage: IntentStorage;
    send: (intent: QuizIntent) => Promise<QuizCommandResult>;
    readRevision: () => Promise<number>;
    newId?: () => string;
  }) { this.key = "masaarat.technical-command.v1:" + JSON.stringify([options.actorId, options.lessonId]); }
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const job = this.tail.then(work); this.tail = job.then(()=>undefined,()=>undefined); return job;
  }
  private current(check: () => boolean) { if (!check()) throw new TechnicalCommandError("TECHNICAL_COMMAND_CANCELLED"); }
  private load() {
    if (this.loaded) return;
    const raw = this.options.storage.getItem(this.key);
    if (raw !== null) {
      try { const p: unknown = JSON.parse(raw); if (!validQuizIntent(p,this.options.actorId,this.options.lessonId)) throw Error(); this.pending=p; }
      catch { this.corrupt=true; this.blocked=true; }
    }
    this.loaded=true;
  }
  private clear() {
    this.pending=null;
    try { this.options.storage.removeItem(this.key); } catch { /* A durable old UUID can only replay its old result. */ }
  }
  private async read(check: () => boolean) {
    this.current(check); const revision=await this.options.readRevision(); this.current(check);
    if (!validQuizRevision(revision)) throw new TechnicalCommandError("TECHNICAL_COMMAND_INVALID");
    // Reconciliation validates authority but never rebases an earlier user action.
    this.revision=null;
  }
  private async dispatch(check: () => boolean): Promise<QuizCommandResult> {
    this.current(check); const intent=this.pending!;
    // No network write when durable recovery is unavailable.
    this.options.storage.setItem(this.key,JSON.stringify(intent));
    let result: QuizCommandResult;
    try { result=await this.options.send(intent); }
    catch (e) {
      if (e instanceof TechnicalCommandError && definitive.has(e.code)) { this.clear(); this.blocked=true; this.revision=null; }
      throw e;
    }
    if (!result?.allowed) throw new TechnicalCommandError("TECHNICAL_ACCESS_REQUIRED");
    const c=result.command;
    if (!c || c.requestId!==intent._technicalCommand.requestId || !validQuizRevision(c.appliedRevision) || !validQuizRevision(c.currentRevision) || c.appliedRevision!==intent._technicalCommand.expectedRevision+1 || c.currentRevision<c.appliedRevision || typeof c.replayed!=="boolean" || (!c.replayed && c.currentRevision!==c.appliedRevision)) {
      throw new TechnicalCommandError("TECHNICAL_COMMAND_INVALID_RESPONSE");
    }
    this.clear();
    if(c.appliedRevision!==c.currentRevision) { this.blocked=true; this.revision=null; throw new TechnicalCommandError("TECHNICAL_COMMAND_RECONCILE_REQUIRED"); }
    this.revision=c.currentRevision;
    return result;
  }
  run<T extends QuizCommandResult>(action: QuizAction, locale: SupportedLocale, payload: Record<string,unknown>, displayedRevision: number | null, check: () => boolean): Promise<T> {
    // Capture the undispatched action's data now; bind its version only when its
    // causally preceding local command is acknowledged.
    const data=JSON.parse(JSON.stringify(payload)) as Record<string,unknown>;
    return this.serial(async()=>{
      this.current(check);
      if(!validQuizRevision(displayedRevision)) throw new TechnicalCommandError("TECHNICAL_COMMAND_STATUS_REQUIRED");
      this.load();
      if(this.blocked) throw new TechnicalCommandError("TECHNICAL_COMMAND_RECONCILE_REQUIRED");
      if(this.pending) {
        const same=this.pending.action===action && this.pending.locale===locale && stable(this.pending.data)===stable(data);
        const prior=await this.dispatch(check); this.current(check);
        if(same) return prior as T;
      }
      // Only a receipt from this lane may advance a causal successor. A fresh
      // status response must never rebase the version captured at user action.
      const expectedRevision=Math.max(displayedRevision,this.revision??displayedRevision);
      this.current(check);
      const intent:QuizIntent={action,lessonId:this.options.lessonId,locale,data,_technicalCommand:{requestId:(this.options.newId??(()=>crypto.randomUUID()))(),actorId:this.options.actorId,expectedRevision}};
      if(!validQuizIntent(intent,this.options.actorId,this.options.lessonId)) throw new TechnicalCommandError("TECHNICAL_COMMAND_INVALID");
      this.pending=intent;
      const result=await this.dispatch(check); this.current(check); return result as T;
    });
  }
  /** Explicit recovery: resolve an uncertain UUID, then read current progress.
   * Never creates a replacement reset/quiz or displays a historical grade. */
  reconcile(check: () => boolean): Promise<void> {
    return this.serial(async()=>{
      this.current(check);this.load();
      if(this.pending) {
        try { await this.dispatch(check); }
        catch(e) { if(!(e instanceof TechnicalCommandError) || (!definitive.has(e.code)&&e.code!=="TECHNICAL_COMMAND_RECONCILE_REQUIRED")) throw e; }
      }
      await this.read(check);
      if(this.corrupt) { this.options.storage.removeItem(this.key);this.corrupt=false; }
      this.blocked=false;
    });
  }
}
