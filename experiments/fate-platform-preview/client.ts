import type { AcademicCourse } from "@/lib/academic-education/types";
import { catalogue } from "./data";
export type AcademicProgress = {read:boolean;quizPassed:boolean;practiceSubmitted:boolean;drafts:Record<string,string[]>};
export const academicQueryKey = (u:unknown,c:string,l:string,locale:string) => ["public-preview",u,c,l,locale];
export async function academicCatalogue(locale: string): Promise<AcademicCourse[]> { return catalogue(locale); }
export async function academicCanAccess(): Promise<boolean> { return false; }
export async function academicCommand<T>(): Promise<T> { throw new Error("READ_ONLY_PREVIEW_NO_COMMANDS"); }
export async function academicDownload(): Promise<never> { throw new Error("PREVIEW_DOWNLOAD_NOT_BOUND"); }
