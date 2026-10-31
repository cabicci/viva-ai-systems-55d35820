import { boxedAssistantFixture } from "@/test/boxed-assistant-runtime-fixture";
import {afterAll,afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {StrictMode} from 'react';
import type {AssistantAdapter,AssistantQuestion} from '@/lib/card-assistant/types';
import type {AssistantRuntimeRequestPayload,AssistantRuntimeResponsePayload} from '@/lib/assistant-runtime';
import type {useAuth,AuthGeneration} from '@/lib/auth-context';
import type {LearnerContext} from '@/lib/learner-context';
import type {LocaleContextValue} from '@/lib/locale/locale-context';
import type {AssistantConversationPanelProps} from './AssistantConversationPanel';
import type {AssistantContextOverride} from '@/lib/assistant/resolve-assistant-learner-context';
const h=vi.hoisted(()=>({auth:null as ReturnType<typeof useAuth>|null,ctx:null as LearnerContext|null,locale:null as LocaleContextValue|null,
  ask:null as AssistantAdapter|null,call:null as (((p:AssistantRuntimeRequestPayload)=>unknown)|null),calls:[] as AssistantRuntimeRequestPayload[],childProps:null as AssistantConversationPanelProps|null}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>{if(!h.auth)throw Error('fixture');return h.auth;}}));
vi.mock('@/lib/learner-context',()=>({useLearnerContext:()=>{if(!h.ctx)throw Error('fixture');return h.ctx;}}));
vi.mock('@/lib/locale/locale-context',()=>({useLocale:()=>{if(!h.locale)throw Error('fixture');return h.locale;}}));
vi.mock('@/lib/assistant-runtime',()=>({callGuardedAssistantRuntimeBoxed:(p:AssistantRuntimeRequestPayload)=>{h.calls.push(p);if(!h.call)throw Error('fixture');return boxedAssistantFixture(h.call(p));}}));
vi.mock('./AssistantConversationPanel',async()=>{
 const real=await vi.importActual<typeof import('./AssistantConversationPanel')>('./AssistantConversationPanel');
 return {...real,AssistantConversationPanel:(props:AssistantConversationPanelProps)=>{h.ask=props.ask;h.childProps=props;return <real.AssistantConversationPanel {...props}/>;}};
});
import {AssistantPanel} from './AssistantPanel';
import {PATHS} from '@/lib/curriculum-data';
import {historyKey,readHistory,writeHistory} from '@/lib/card-assistant/history';
import {AssistantRequestError} from '@/lib/card-assistant/errors';
let actor='actor-A',loading=false,available=true,generation:AuthGeneration=Object.freeze({value:43});
let originalStorage:PropertyDescriptor|undefined,events:unknown[]=[],allEvents:unknown[][]=[];
const listener=(reason:unknown)=>{events.push(reason);};
const store=new Map<string,string>();
function user(id:string):NonNullable<ReturnType<typeof useAuth>['user']>{return {id,aud:'authenticated',role:'authenticated',email:'private-unused@example.invalid',app_metadata:{},user_metadata:{},created_at:'2026-10-25T00:00:00Z'};}
function auth(accessors=true){
 const principal=user(actor);Object.freeze(principal.app_metadata);Object.freeze(principal.user_metadata);
 const base={user:principal,session:null,loading:false,authContinuity: Object.freeze({ continuity: 0 }), authGeneration:generation,isAuthGenerationCurrent:(g:typeof generation)=>g===generation,signOut:async()=>{},authError:null};
 if(accessors){Object.defineProperty(principal,'id',{get:()=>actor,enumerable:true});Object.freeze(principal);
   Object.defineProperties(base,{user:{get:()=>available?principal:null,enumerable:true},loading:{get:()=>loading,enumerable:true},authGeneration:{get:()=>generation,enumerable:true}});}
 h.auth=Object.freeze(base);
 return principal;
}
function context():LearnerContext{
 const path=PATHS.find(p=>p.status==='open');if(!path)throw Error('real open PATH missing');
 return {currentUser:{id:actor,email:null,isAuthenticated:true},currentRoute:'/ai-assistant',currentPath:path,currentModule:null,currentLesson:null,currentLessonStatus:null,currentMission:null,
  completedLessonsCount:2,totalLessonsCount:9,overallCompletedLessonsCount:5,overallTotalLessonsCount:30,overallNextLesson:null,lastCompletedLesson:null,nextLesson:null,isReady:true,contentError:null,resolvedAt:'initial'};
}
function response(answer='**current answer**'):AssistantRuntimeResponsePayload{return {ok:true,runtime:'connected',receivedQuery:'question',retrievalCount:1,contextDetected:true,learnerContext:{currentPath:null,currentModule:null,currentLesson:null},message:'fallback',ts:'not-read',answer,citations:[]};}
function question(history?:AssistantQuestion['history']):AssistantQuestion{return {scope:{area:'ai',cardId:h.ctx?.currentPath?.id??'',locale:h.locale?.locale??'en'},query:' question unchanged ',requestId:'private-unused',...(history===undefined?{}:{history})};}
function saved(){if(!h.ask)throw Error('no saved actual adapter');return h.ask;}
function deferred(){let resolve!:(v:unknown)=>void,reject!:(e:unknown)=>void;const promise=new Promise<unknown>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
async function retired(p:ReturnType<AssistantAdapter>){let cause:unknown;try{await p;}catch(e){cause=e;}expect(cause).toBeInstanceOf(AssistantRequestError);expect((cause instanceof AssistantRequestError?cause.message:'WRONG')).toBe('');}
async function turn(){await new Promise<void>(r=>setTimeout(r,0));}
beforeEach(()=>{
 actor='actor-A';loading=false;available=true;generation=Object.freeze({value:43});events=[];process.on('unhandledRejection',listener);
 h.calls=[];h.call=()=>response();h.ask=null;h.childProps=null;h.locale={locale:'en',dir:'ltr',lang:'en',displayName:'English',setLocale:()=>{}};auth();h.ctx=context();store.clear();
 originalStorage=Object.getOwnPropertyDescriptor(window,'localStorage');Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>{store.set(k,v);},removeItem:(k:string)=>{store.delete(k);}}});
});
afterEach(async()=>{cleanup();await turn();await turn();allEvents.push([...events]);process.off('unhandledRejection',listener);if(originalStorage)Object.defineProperty(window,'localStorage',originalStorage);expect(events).toEqual([]);});
afterAll(()=>{console.log('R30_ACTUAL_UNHANDLED_EVENTS',JSON.stringify(allEvents));});
describe('r30 NEW decisive adapter boundary cases',()=>{
 it('A01 saved actual adapter rejects actor change before helper entry',async()=>{render(<AssistantPanel/>);const ask=saved();actor='actor-B';await retired(ask(question()));expect(h.calls).toHaveLength(0);});
 it('A02 retirement during helper return never reads lazy then',async()=>{let thenReads=0;h.call=()=>{actor='actor-B';return {get then(){thenReads++;return (resolve:(v:unknown)=>void)=>resolve(response());}};};render(<AssistantPanel/>);await retired(saved()(question()));expect(h.calls).toHaveLength(1);expect(thenReads).toBe(0);});
 it('A03 settled native old response is never mapped after actor changes',async()=>{let reads=0;const d=deferred();h.call=()=>d.promise;render(<AssistantPanel/>);const pending=saved()(question());actor='actor-B';d.resolve({get ok(){reads++;return true;},get answer(){reads++;return 'old';},get citations(){reads++;return [];}});await retired(pending);expect(reads).toBe(0);});
 it('A04 actual own-data child never saves retired adapter answer',async()=>{
  const principal=auth(false),d=deferred();h.call=()=>d.promise;const ui=render(<AssistantPanel/>);const input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'genuine question'}});fireEvent.submit(input.closest('form')!);expect(h.calls).toHaveLength(1);
  principal.id='actor-B';await act(async()=>{d.resolve(response('OLD PRIVATE ANSWER'));await turn();});
  expect([...store.values()].join('')).not.toContain('OLD PRIVATE ANSWER');expect(ui.queryByText('OLD PRIVATE ANSWER')).toBeNull();expect(ui.queryByRole('alert')).toBeNull();
 });
});
describe('r30 focused real adapter controls',()=>{
 for(const locale of ['en','ar-EG','ar-MSA','ar-Gulf'] as const)it('C01 exact real builder payload '+locale,async()=>{
  h.locale={locale,dir:locale==='en'?'ltr':'rtl',lang:locale,displayName:locale,setLocale:()=>{}};
  render(<AssistantPanel/>);const result=await saved()(question());expect(result).toEqual({status:200,answer:'**current answer**',citations:[]});
  expect(h.calls).toHaveLength(1);expect(h.calls[0]).toEqual({query:' question unchanged ',learnerContext:{locale,currentPath:h.ctx?.currentPath?.id,currentModule:null,currentLesson:null,currentPathTitle:h.childProps?.cardTitle, currentModuleTitle:null,currentLessonTitle:null,completedLessonsCount:5,totalLessonsCount:30,nextLessonTitle:null,currentMission:null}});
  expect(Object.keys(h.calls[0])).toEqual(['query','learnerContext']);
 });
 it('C02 real builder copies exact history and ignores unused input',async()=>{
  render(<AssistantPanel/>);let unused=0;const q=question([{question:'  exact question  ',answer:'exact answer'}]);Object.defineProperties(q,{requestId:{get(){unused++;throw Error('unused requestId');}},scope:{get(){unused++;throw Error('unused scope');}}});
  await saved()(q);expect(h.calls[0].conversationHistory).toEqual([{question:'  exact question  ',answer:'exact answer'}]);expect(unused).toBe(0);
 });
 it('C03 real empty history is omitted',async()=>{render(<AssistantPanel/>);await saved()(question([]));expect(h.calls[0]).not.toHaveProperty('conversationHistory');});
 it('C04 readiness is badge only',async()=>{if(!h.ctx)throw Error();h.ctx={...h.ctx,isReady:false};render(<AssistantPanel/>);expect((await saved()(question())).status).toBe(200);});
 it('C05 current no path returns original 403',async()=>{if(!h.ctx)throw Error();h.ctx={...h.ctx,currentPath:null};render(<AssistantPanel/>);expect(await saved()(question())).toEqual({status:403});expect(h.calls).toHaveLength(0);});
 it('C06 current helper denial returns original 503',async()=>{h.call=()=>({...response(),ok:false});render(<AssistantPanel/>);expect(await saved()(question())).toEqual({status:503});});
 it('C07 answer fallback and exact citation allowlist',async()=>{
  let unused=0;const r=response();delete r.answer;r.message='fallback';r.citations=['/learn/path/lesson','https://outside.invalid','//outside/path','/learn/path/lesson/extra','/learn/PATH/lesson','/learn/path/lesson?x=1'].map((productionRoute,i)=>({lessonId:'lesson-'+i,title:'Source '+i,productionRoute,get excerpt():string{unused++;throw Error('unused excerpt');}}));
  Object.defineProperties(r,{ts:{get(){unused++;throw Error('unused ts');}},runtime:{get(){unused++;throw Error('unused runtime');}}});h.call=()=>r;render(<AssistantPanel/>);const result=await saved()(question());expect(result.answer).toBe('fallback');expect(result.citations?.[0]).toEqual({id:'lesson-0',label:'Source 0',stepId:'lesson-0',sourceId:'lesson-0',href:'/learn/path/lesson?locale=en'});expect(result.citations?.slice(1).every(c=>!('href' in c))).toBe(true);expect(unused).toBe(0);
 });
 it('C08 compact override uses actual resolver and mission subset',async()=>{
  const override:AssistantContextOverride={currentPathId:'package-path',currentModuleId:'module-1',currentLessonId:'lesson-1',currentPathTitle:'Path',currentModuleTitle:'Module',currentLessonTitle:'Lesson',nextLessonTitle:'Next',currentMission:{intro:'Intro',prompt:'Prompt'}};
  render(<AssistantPanel compact contextOverride={override}/>);await saved()(question());expect(h.calls[0].learnerContext).toEqual({locale:'en',currentPath:'package-path',currentModule:'module-1',currentLesson:'lesson-1',currentPathTitle:'Path',currentModuleTitle:'Module',currentLessonTitle:'Lesson',completedLessonsCount:2,totalLessonsCount:9,nextLessonTitle:'Next',currentMission:{intro:'Intro',prompt:'Prompt'}});
 });
 it('C09 current plain helper errors preserve identity and copy',async()=>{const error=new AssistantRequestError('genuine current failure');h.call=()=>{throw error;};render(<AssistantPanel/>);await expect(saved()(question())).rejects.toBe(error);});
 it('C10 current rejected native error preserved',async()=>{const d=deferred(),error=new Error('native current');h.call=()=>d.promise;render(<AssistantPanel/>);const pending=saved()(question());d.reject(error);await expect(pending).rejects.toBe(error);});
 it('C11 current malformed result stays an honest failure',async()=>{h.call=()=>({...response(),citations:{bad:true}});render(<AssistantPanel/>);await expect(saved()(question())).rejects.toBeInstanceOf(TypeError);});
 it('C12 null helper response retains current rejection',async()=>{h.call=()=>null;render(<AssistantPanel/>);await expect(saved()(question())).rejects.toBeInstanceOf(TypeError);});
 it('C13 frozen actual context and override preserve guarded resolver reads',async()=>{
  if(!h.ctx)throw Error();h.ctx=Object.freeze({...h.ctx,currentUser:Object.freeze({...h.ctx.currentUser})});
  const override=Object.freeze({currentPathId:'frozen-path',currentModuleId:'frozen-module',currentLessonId:'frozen-lesson',currentPathTitle:'P',currentModuleTitle:'M',currentLessonTitle:'L',nextLessonTitle:null,currentMission:Object.freeze({intro:'frozen intro',prompt:'frozen prompt'})});
  render(<AssistantPanel compact contextOverride={override}/>);expect((await saved()(question())).status).toBe(200);expect(h.calls[0].learnerContext.currentMission).toEqual({intro:'frozen intro',prompt:'frozen prompt'});
 });
 for(const transition of ['actor','null','loading','generation'] as const)it('G01 fixed snapshot retirement '+transition,async()=>{
  render(<AssistantPanel/>);const ask=saved();if(transition==='actor')actor='actor-B';if(transition==='null')available=false;if(transition==='loading')loading=true;if(transition==='generation')generation=Object.freeze({value:43});
  await retired(ask(question()));expect(h.calls).toHaveLength(0);
 });
 it('G02 observed actor ABA cannot revive a saved callback',async()=>{render(<AssistantPanel/>);const ask=saved();actor='actor-B';await retired(ask(question()));actor='actor-A';await retired(ask(question()));expect(h.calls).toHaveLength(0);});
 it('G03 true is mandatory for the public generation predicate',async()=>{
  if(!h.auth)throw Error();h.auth=Object.freeze({...h.auth,isAuthGenerationCurrent:()=>false});render(<AssistantPanel/>);await retired(saved()(question()));expect(h.calls).toHaveLength(0);
 });
 it('G04 a throwing live actor getter fails closed',async()=>{
  let throws=false;const base=auth(false);Object.defineProperty(base,'id',{get(){if(throws)throw Error('actor getter');return actor;}});render(<AssistantPanel/>);const ask=saved();throws=true;await retired(ask(question()));expect(h.calls).toHaveLength(0);
 });
 it('G05 helper return native rejection is observed before retirement',async()=>{
  h.call=()=>{actor='actor-B';return Promise.reject(new Error('retired native'));};render(<AssistantPanel/>);await retired(saved()(question()));
 });
 it('G06 native own then never read by adapter',async()=>{
  let reads=0;const d=deferred();Object.defineProperty(d.promise,'then',{get(){reads++;throw Error('native own then');}});h.call=()=>d.promise;render(<AssistantPanel/>);const pending=saved()(question());d.resolve(response());expect((await pending).status).toBe(200);expect(reads).toBe(0);
 });
 it('G07 queued lazy invocation is denied after retirement',async()=>{
  let reads=0,invokes=0;h.call=()=>({get then(){reads++;return (resolve:(v:unknown)=>void)=>{invokes++;resolve(response());};}});render(<AssistantPanel/>);const pending=saved()(question());actor='actor-B';await retired(pending);expect(reads).toBe(1);expect(invokes).toBe(0);
 });
 it('G08 lazy derived rejection is intrinsically observed',async()=>{
  h.call=()=>({then(resolve:(v:unknown)=>void){resolve(response());return Promise.reject(new Error('derived observed'));}});render(<AssistantPanel/>);expect((await saved()(question())).status).toBe(200);
 });
 it('G09 nested lazy response cannot be visited after retirement',async()=>{
  let reads=0;h.call=()=>({then(resolve:(v:unknown)=>void){actor='actor-B';resolve({get then(){reads++;throw Error('retired nested');}});}});render(<AssistantPanel/>);await retired(saved()(question()));expect(reads).toBe(0);
 });
 for(const key of ['ok','answer','citations'] as const)it('G10 reply getter retirement '+key,async()=>{
  let after=0;const r=response();Object.defineProperty(r,key,{get(){actor='actor-B';return key==='ok'?true:key==='answer'?'retired':[];}});Object.defineProperty(r,'message',{get(){after++;return 'must not read';}});h.call=()=>r;render(<AssistantPanel/>);await retired(saved()(question()));expect(after).toBe(0);
 });
 for(const key of ['lessonId','title','productionRoute'] as const)it('G11 citation getter retirement '+key,async()=>{
  const citation={lessonId:'id',title:'label',productionRoute:'/learn/path/lesson',excerpt:'unused'};Object.defineProperty(citation,key,{get(){actor='actor-B';return key==='productionRoute'?'/learn/path/lesson':'value';}});h.call=()=>({...response(),citations:[citation]});render(<AssistantPanel/>);await retired(saved()(question()));
 });
 it('G12 query getter retirement stops history preparation',async()=>{let reads=0;render(<AssistantPanel/>);const q=question();Object.defineProperties(q,{query:{get(){actor='actor-B';return 'question';}},history:{get(){reads++;return [];}}});await retired(saved()(q));expect(reads).toBe(0);expect(h.calls).toHaveLength(0);});
 it('G13 history row retirement stops the helper',async()=>{render(<AssistantPanel/>);const row={get question(){actor='actor-B';return 'question';},get answer():string{throw Error('retired answer getter');}};await retired(saved()(question([row])));expect(h.calls).toHaveLength(0);});
 it('G14 unmount permanently retires old adapter',async()=>{const ui=render(<AssistantPanel/>),ask=saved();ui.unmount();await retired(ask(question()));expect(h.calls).toHaveLength(0);});
 it('G15 old overlapping finally cannot retire the new action',async()=>{const a=deferred(),b=deferred();let entered=0;h.call=()=>++entered===1?a.promise:b.promise;render(<AssistantPanel/>);const ask=saved(),first=ask(question()),second=ask(question());a.resolve(response('old'));await retired(first);b.resolve(response('new'));expect((await second).answer).toBe('new');expect(h.calls).toHaveLength(2);}, 30_000);
 it('G16 old semantic scope ABA callback never revives',async()=>{
  const override:AssistantContextOverride={currentPathId:'p',currentModuleId:'m',currentLessonId:'A',currentPathTitle:'P',currentModuleTitle:'M',currentLessonTitle:'A',nextLessonTitle:null,currentMission:null};
  const ui=render(<AssistantPanel compact contextOverride={override}/>);const old=saved();ui.rerender(<AssistantPanel compact contextOverride={{...override,currentLessonId:'B'}}/>);ui.rerender(<AssistantPanel compact contextOverride={{...override}}/>);await retired(old(question()));expect(h.calls).toHaveLength(0);
 });
 it('G17 live source semantic mutation before render retires the action',async()=>{if(!h.ctx)throw Error();render(<AssistantPanel compact/>);const ask=saved();h.ctx.overallCompletedLessonsCount=99;await retired(ask(question()));expect(h.calls).toHaveLength(0);});
 it('D01 actual child renders real Markdown, citation and private history',async()=>{
  auth(false);h.call=()=>({...response('**REAL BODY**'),citations:[{lessonId:'lesson',title:'Real source',productionRoute:'/learn/path/lesson',excerpt:'unused'}]});const ui=render(<AssistantPanel/>);const input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'actual current question'}});await act(async()=>{fireEvent.submit(input.closest('form')!);await turn();});
  expect(ui.getByText('REAL BODY').tagName).toBe('STRONG');expect(ui.getByRole('link',{name:'Real source'}).getAttribute('href')).toBe('/learn/path/lesson?locale=en');expect(ui.queryByRole('alert')).toBeNull();expect(input.hasAttribute('disabled')).toBe(false);
  if(!h.childProps)throw Error();expect(readHistory(historyKey(h.childProps.scope,'actor-A'))[0].answer).toBe('**REAL BODY**');
 });
 it('D02 harmless context/resolvedAt and predicate identity churn preserve draft and selection',async()=>{
  auth(false);const ui=render(<AssistantPanel/>);const input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'keep draft'}});const selected=ui.getByRole('combobox').getAttribute('value');
  if(!h.ctx||!h.auth)throw Error();h.ctx={...h.ctx,resolvedAt:'harmless-new-object'};h.auth=Object.freeze({...h.auth,isAuthGenerationCurrent:(g:typeof generation)=>g===generation});ui.rerender(<AssistantPanel/>);
  expect(ui.getByRole('textbox')).toBe(input);expect((ui.getByRole('textbox') as HTMLTextAreaElement).value).toBe('keep draft');expect(ui.getByRole('combobox').getAttribute('value')).toBe(selected);
 });
 it('D03 actual child history bounds remain last3 with exact string bounds',async()=>{
  auth(false);render(<AssistantPanel/>);if(!h.childProps)throw Error();const scope=h.childProps.scope;cleanup();writeHistory(historyKey(scope,'actor-A'),Array.from({length:5},(_,i)=>({question:'Q'+i+'x'.repeat(900),answer:'A'+i+'y'.repeat(1400),citations:[]})));
  const ui=render(<AssistantPanel/>),input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'  next question  '}});await act(async()=>{fireEvent.submit(input.closest('form')!);await turn();});expect(h.calls[0].query).toBe('next question');expect(h.calls[0].conversationHistory).toEqual([2,3,4].map(i=>({question:('Q'+i+'x'.repeat(900)).slice(0,500),answer:('A'+i+'y'.repeat(1400)).slice(0,1200)})));
 });
 it('D04 standalone uses real open PATHS and preserves empty choice',async()=>{
  auth(false);const ui=render(<AssistantPanel/>);const select=ui.getByRole('combobox');expect(select.querySelectorAll('option').length).toBe(PATHS.filter(p=>p.status==='open').length+1);fireEvent.change(select,{target:{value:''}});expect(h.childProps?.scope.cardId).toBe('');expect(await saved()(question())).toEqual({status:403});expect(h.calls).toHaveLength(0);
 });
 it('D05 StrictMode old lifetime never revives and fresh child remains usable',async()=>{
  auth(false);const ui=render(<StrictMode><AssistantPanel/></StrictMode>);await act(async()=>{await turn();});const input=ui.getByRole('textbox');expect(input.hasAttribute('disabled')).toBe(false);fireEvent.change(input,{target:{value:'strict current question'}});await act(async()=>{fireEvent.submit(input.closest('form')!);await turn();});expect(ui.getByText('current answer')).toBeTruthy();expect(h.calls).toHaveLength(1);
 });
 it('D06 retired settled DOM request cannot clear a fresh child busy state',async()=>{
  const oldUser=auth(false),a=deferred(),b=deferred();let entered=0;h.call=()=>++entered===1?a.promise:b.promise;const ui=render(<AssistantPanel/>);let input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'old request'}});fireEvent.submit(input.closest('form')!);oldUser.id='actor-B';actor='actor-B';auth(false);ui.rerender(<AssistantPanel/>);input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'fresh request'}});fireEvent.submit(input.closest('form')!);expect(h.calls).toHaveLength(2);await act(async()=>{a.resolve(response('OLD'));await turn();});expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(true);await act(async()=>{b.resolve(response('FRESH'));await turn();});expect(ui.getByText('FRESH')).toBeTruthy();expect(ui.queryByText('OLD')).toBeNull();expect(ui.queryByRole('alert')).toBeNull();expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);
 }, 30_000);
});
