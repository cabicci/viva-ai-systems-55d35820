export function checkAcademicCompletionRevision(): {
  sql: string;
  report: {
    items: number[];
    sourceLessons: number;
    exactBeforeAfter: boolean;
    arithmetic: Record<string, number>;
    databaseChanged: boolean;
  };
};
