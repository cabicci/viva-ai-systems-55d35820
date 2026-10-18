export const WEEKLY_REVIEW_VIDEO: Readonly<{
  libraryId: number;
  videoId: string;
  oldTitle: string;
  newTitle: string;
}>;
export function reviseWeeklyReviewVideoTitle(input?: {
  apiKey?: string;
  apply?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<Record<string, unknown>>;
