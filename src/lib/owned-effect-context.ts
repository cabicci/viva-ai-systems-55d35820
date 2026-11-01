/** Client lifetime fence for best-effort effects, never server authorization. */
export interface OwnedEffectContext {
  readonly userId: string;
  isCurrent(): boolean;
}
export function ownsCurrentEffect(context: OwnedEffectContext | undefined, userId: string | null): boolean {
  return userId !== null && userId.length > 0 && (!context || (context.userId === userId && context.isCurrent()));
}
