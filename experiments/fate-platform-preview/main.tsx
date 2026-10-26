import { createRoot } from "react-dom/client";
import { createRootRoute, createRoute, createRouter, RouterProvider, Outlet, useRouterState } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { PlatformHomePage as Index } from "@/components/site/PlatformHomePage";
import { AcademicCataloguePage } from "@/components/academic-education/AcademicCataloguePage";
import { AcademicLessonPreview } from "@/components/academic-education/AcademicLessonPage";
import { CurriculumLayout } from "@/components/site/CurriculumLayout";
import { LocaleProvider, useLocale } from "@/lib/locale/locale-context";
import { bindings, courseId, firstLesson, firstFigures } from "./data";
import "./style.css";
const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
function RootShell(){const search=useRouterState({select:s=>s.location.search}) as {locale?:string};const locale=(["ar-EG","ar-MSA","ar-Gulf","en"].includes(search.locale??"")?search.locale:"ar-EG") as "ar-EG"|"ar-MSA"|"ar-Gulf"|"en";return <QueryClientProvider client={queryClient}><LocaleProvider initialLocale={locale}><LocaleDocument/><CourseLocaleGate/></LocaleProvider></QueryClientProvider>;}
function CourseLocaleGate(){const {locale}=useLocale();const path=useRouterState({select:s=>s.location.pathname});if(path.startsWith("/academic")&&locale!=="ar-EG"&&locale!=="en")return <CurriculumLayout line="academic" subtitle="المسار ده متاح حاليًّا بالعربي المصري والإنجليزي. النسخة المختارة غير متاحة في المعاينة."><div className="flex gap-4"><a className="underline" href={`${path}?locale=ar-EG`}>افتح النسخة المصرية</a><a className="underline" href={`${path}?locale=en`}>Open English</a></div></CurriculumLayout>;return <Outlet/>;}

function LocaleDocument(){const {dir,lang}=useLocale();useEffect(()=>{document.documentElement.dir=dir;document.documentElement.lang=lang;},[dir,lang]);return null;}
function Catalogue(){return <AcademicCataloguePage/>;}
function Path(){return <AcademicCataloguePage courseId={courseId}/>;}
function Contents(){return <AcademicCataloguePage courseId={courseId} contents/>;}
function Lesson(){const {locale}=useLocale();const path=useRouterState({select:s=>s.location.pathname});const id=decodeURIComponent(path.split("/").pop()??"");const binding=bindings.find(x=>x.nativeId===id);
 const media=useQuery({queryKey:["verified-preview-bunny",locale],queryFn:async()=>{const r=await fetch("/__fate-media/manifest.json");if(!r.ok)return {};return r.json();}});
 if(binding?.stableID!=="FATE2-S01")return <CurriculumLayout line="academic" subtitle={locale==="en"?"This step is not yet bound to this preview.":"الخطوة دي لسه مش مرتبطة بالمعاينة دي."}><a className="underline" href={`/academic/courses/${courseId}/contents?locale=${locale}`}>{locale==="en"?"Return to stations and steps":"ارجع للمحطات والخطوات"}</a></CurriculumLayout>;
 const item=media.data?.[locale];const video=item?.status==="verified" && typeof item?.iframeUrl==="string" && /^https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/[a-f0-9-]+\?autoplay=false&preload=false$/.test(item.iframeUrl)?item.iframeUrl:null;
 return <><AcademicLessonPreview key={locale} courseId={courseId} delivery={{lesson:firstLesson(locale),video,files:[],assistantAllowed:false,reviewOnly:true}} figures={firstFigures(locale)}/>{!video&&<p role="status" className="mx-auto max-w-7xl px-4 pb-8">{locale==="en"?"The accepted lesson video is awaiting its verified hosting binding. No substitute or unverified URL is shown.":"فيديو الدرس المعتمد مستنّي ربط الاستضافة الفعلي. مفيش فيديو بديل أو رابط غير متحقق منه."}</p>}</>;
}
function Outside(){const {locale}=useLocale();return <CurriculumLayout line="academic" subtitle={locale==="en"?"This service is not connected in the public preview.":"الخدمة دي مش متصلة في معاينة المحتوى العام."}><a href={`/?locale=${locale}`} className="underline">{locale==="en"?"Home":"الرئيسية"}</a></CurriculumLayout>;}
const root=createRootRoute({component:RootShell});const route=(path:string,component:()=>React.JSX.Element)=>createRoute({getParentRoute:()=>root,path,validateSearch:(s:Record<string,unknown>)=>({locale:["ar-EG","ar-MSA","ar-Gulf","en"].includes(String(s.locale))?String(s.locale):"ar-EG"}),component});
const router=createRouter({routeTree:root.addChildren([route("/",Index),route("/academic",Catalogue),route("/academic/curriculum",Catalogue),route("/academic/courses/$courseId",Path),route("/academic/courses/$courseId/contents",Contents),route("/academic/learn/$lessonId",Lesson),route("/$",Outside)])});
createRoot(document.getElementById("root")!).render(<RouterProvider router={router}/>);
