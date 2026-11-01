import { boxedAssistantFixture } from "@/test/boxed-assistant-runtime-fixture";
import {afterAll,afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render} from '@testing-library/react';
import {StrictMode,type SetStateAction} from 'react';
import type {useAuth,AuthGeneration} from '@/lib/auth-context';
import type {AssistantQuestion,AssistantReply,AssistantScope} from '@/lib/card-assistant/types';
import type {LearnerContext} from '@/lib/learner-context';
import type {LocaleContextValue} from '@/lib/locale/locale-context';
import type {AssistantRuntimeRequestPayload,AssistantRuntimeResponsePayload} from '@/lib/assistant-runtime';
import type {AssistantConversationPanelProps} from './AssistantConversationPanel';
const h=vi.hoisted(()=>({auth:null as ReturnType<typeof useAuth>|null,ctx:null as LearnerContext|null,locale:null as LocaleContextValue|null,
 ask:null as (((q:AssistantQuestion)=>unknown)|null),runtime:null as (((q:AssistantRuntimeRequestPayload)=>unknown)|null),beforeUpdater:null as (()=>void)|null,
 calls:[] as AssistantQuestion[],runtimeCalls:[] as AssistantRuntimeRequestPayload[],trace:[] as {event:string;key?:string}[]}));
vi.mock('react',async()=>{
 const real=await vi.importActual<typeof import('react')>('react');
 function isUpdater<T>(value:SetStateAction<T>):value is (previous:T)=>T{return typeof value==='function';}
 function useState<T>(initial:T|(()=>T)){
  const [value,set]=real.useState(initial);
  function forward(change:SetStateAction<T>){if(isUpdater(change))set(previous=>{h.beforeUpdater?.();return change(previous);});else set(change);}
  return [value,forward] as const;
 }
 return {...real,useState};
});
vi.mock('@/lib/auth-context',()=>({useAuth:()=>{if(!h.auth)throw Error('fixture Auth');return h.auth;}}));
vi.mock('@/lib/learner-context',()=>({useLearnerContext:()=>{if(!h.ctx)throw Error('fixture context');return h.ctx;}}));
vi.mock('@/lib/locale/locale-context',()=>({useLocale:()=>{if(!h.locale)throw Error('fixture locale');return h.locale;}}));
vi.mock('@/lib/assistant-runtime',()=>({callGuardedAssistantRuntimeBoxed:(q:AssistantRuntimeRequestPayload)=>{h.runtimeCalls.push(q);if(!h.runtime)throw Error('fixture runtime');return boxedAssistantFixture(h.runtime(q));}}));
import {AssistantConversationPanel} from './AssistantConversationPanel';
import {AssistantPanel} from './AssistantPanel';
import {historyKey,readHistory,writeHistory,type ConversationTurn} from '@/lib/card-assistant/history';
import {AssistantRequestError} from '@/lib/card-assistant/errors';
import {PATHS} from '@/lib/curriculum-data';
import {getUiString} from '@/lib/locale/ui-strings';
type Auth=ReturnType<typeof useAuth>;
let generation:AuthGeneration=Object.freeze({value:73}),boundary:((label:string)=>void)|null=null;
const memory=new Map<string,string>(),reports:unknown[]=[];
let events:{reasonType:string}[]=[],storageDescriptor:PropertyDescriptor|undefined,cryptoDescriptor:PropertyDescriptor|undefined;
const originalParse=JSON.parse,originalStringify=JSON.stringify;
const unhandled=(reason:unknown)=>{events.push({reasonType:typeof reason});};
function user(id:string):NonNullable<Auth['user']>{return {id,aud:'authenticated',role:'authenticated',created_at:'2026-10-25T00:00:00Z',app_metadata:{},user_metadata:{}};}
function currentAuth():Auth{if(!h.auth)throw Error('fixture');return h.auth;}
function ownAuth():Auth{return {user:user('r32-A'),session:null,loading:false,authContinuity: Object.freeze({ continuity: 0 }), authGeneration:generation,isAuthGenerationCurrent:function(captured){return captured===generation;},signOut:async()=>{},authError:null};}
function mark(event:string,key?:string){h.trace.push({event,...(key===undefined?{}:{key})});boundary?.(event);}
function storage(){
 return {
  get getItem(){mark('getItem-lookup');return function getItem(key:string){mark('getItem-entry',key);return memory.get(key)??null;};},
  get setItem(){mark('setItem-lookup');return function setItem(key:string,value:string){mark('setItem-entry',key);memory.set(key,value);};},
  get removeItem(){mark('removeItem-lookup');return function removeItem(key:string){mark('removeItem-entry',key);memory.delete(key);};},
 };
}
function arm(label:string,change:()=>void){boundary=event=>{if(event===label){boundary=null;change();}};}
function actorB(){currentAuth().user=user('r32-B');}
function scope(area:AssistantScope['area']='ai',locale:AssistantScope['locale']='en',cardId='intro'):AssistantScope{return {area,locale,cardId,stepId:'step-1'};}
function reply(answer='**r32 current answer**'):AssistantReply{return {status:200,answer,citations:[]};}
function runtimeReply():AssistantRuntimeResponsePayload{return {ok:true,runtime:'connected',receivedQuery:'q',retrievalCount:1,contextDetected:true,learnerContext:{currentPath:null,currentModule:null,currentLesson:null},message:'current fallback',answer:'AI current reply',ts:'unused',citations:[]};}
function ask(q:AssistantQuestion){h.calls.push(q);if(!h.ask)throw Error('fixture ask');return h.ask(q);}
function deferred(){let resolve!:(value:unknown)=>void,reject!:(error:unknown)=>void;const promise=new Promise<unknown>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function common(s=scope(),account='r32-A',onCitation?:AssistantConversationPanelProps['onCitation']){
 const props:AssistantConversationPanelProps={scope:s,accountId:account,ask:async()=>reply(),...(onCitation?{onCitation}:{})};
 // Deliberately adversarial JS results enter through an own-data fixture field;
 // the real public Props type and actual component remain the consumed APIs.
 Object.defineProperty(props,'ask',{value:ask});return <AssistantConversationPanel {...props}/>;
}
function mount(s=scope(),account='r32-A'){return render(common(s,account));}
function submit(ui:ReturnType<typeof render>,question='  r32 question  '){const input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:question}});const form=input.closest('form');if(!form)throw Error('real form missing');fireEvent.submit(form);return {input,form};}
function entries(name:string){return h.trace.filter(r=>r.event===name);}
async function turn(){await new Promise<void>(resolve=>setTimeout(resolve,0));}
async function settle(d:ReturnType<typeof deferred>,value:unknown=reply()){await act(async()=>{d.resolve(value);await turn();});}
function seed(s=scope(),account='r32-A',turns:ConversationTurn[]=[{question:'old scoped question',answer:'old scoped answer',citations:[]}]){writeHistory(historyKey(s,account),turns);}
function context():LearnerContext{const path=PATHS.find(p=>p.status==='open');if(!path)throw Error('actual PATHS');return {currentUser:{id:'r32-A',email:null,isAuthenticated:true},currentRoute:'/ai-assistant',currentPath:path,currentModule:null,currentLesson:null,currentLessonStatus:null,currentMission:null,completedLessonsCount:1,totalLessonsCount:5,overallCompletedLessonsCount:2,overallTotalLessonsCount:20,overallNextLesson:null,lastCompletedLesson:null,nextLesson:null,isReady:true,contentError:null,resolvedAt:'r32-initial'};}
beforeEach(()=>{
 generation=Object.freeze({value:73});h.auth=ownAuth();h.ctx=context();h.locale={locale:'en',dir:'ltr',lang:'en',displayName:'English',setLocale:()=>{}};
 h.calls=[];h.runtimeCalls=[];h.trace=[];h.ask=()=>reply();h.runtime=()=>runtimeReply();h.beforeUpdater=null;boundary=null;events=[];memory.clear();
 process.on('unhandledRejection',unhandled);storageDescriptor=Object.getOwnPropertyDescriptor(window,'localStorage');
 const actual=storage();Object.defineProperty(window,'localStorage',{configurable:true,get(){mark('storage-lookup');return actual;}});
 cryptoDescriptor=Object.getOwnPropertyDescriptor(globalThis.crypto,'randomUUID');
});
afterEach(async()=>{
 cleanup();boundary=null;h.beforeUpdater=null;JSON.parse=originalParse;JSON.stringify=originalStringify;
 if(storageDescriptor)Object.defineProperty(window,'localStorage',storageDescriptor);
 if(cryptoDescriptor)Object.defineProperty(globalThis.crypto,'randomUUID',cryptoDescriptor);
 else Reflect.deleteProperty(globalThis.crypto,'randomUUID');
 await turn();await turn();reports.push({case:expect.getState().currentTestName,events:[...events],actualTrace:[...h.trace],askEntries:h.calls.length,runtimeEntries:h.runtimeCalls.length});process.off('unhandledRejection',unhandled);expect(events).toEqual([]);
});
afterAll(()=>{console.log('R32_ACTUAL_CASE_EVENTS',originalStringify(reports));});
describe('r32 NEW fixed common storage/outcome boundaries',()=>{
 for(const transition of ['actor','null','loading'] as const)it('S01 post-return storage lookup denies old write '+transition,async()=>{
  const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);expect(h.calls).toHaveLength(1);
  arm('storage-lookup',()=>{if(transition==='actor')actorB();if(transition==='null')currentAuth().user=null;if(transition==='loading')currentAuth().loading=true;});
  await settle(d,reply('RETIRED STORAGE ANSWER'));expect(entries('setItem-entry')).toHaveLength(0);expect(ui.queryByText('RETIRED STORAGE ANSWER')).toBeNull();expect(ui.queryByRole('alert')).toBeNull();
 });
 it('S02 method lookup retirement blocks setItem dispatch',async()=>{const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);arm('setItem-lookup',actorB);await settle(d);expect(entries('setItem-entry')).toHaveLength(0);});
 it('S03 stringify return retirement blocks later storage entry',async()=>{
  const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);const before=entries('storage-lookup').length;
  JSON.stringify=function(value,replacer,space){mark('stringify-entry');actorB();return typeof replacer === "function" ? originalStringify(value,replacer,space) : originalStringify(value,replacer,space);};await settle(d);
  expect(entries('stringify-entry')).toHaveLength(1);expect(entries('storage-lookup')).toHaveLength(before);expect(entries('setItem-entry')).toHaveLength(0);
 });
 it('S04 getItem method getter retirement blocks read dispatch',()=>{arm('getItem-lookup',actorB);const ui=mount();expect(entries('getItem-entry')).toHaveLength(0);expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(true);});
 it('S05 entered getItem cannot publish parsed old history after retirement',()=>{seed();arm('getItem-entry',actorB);const ui=mount();expect(entries('getItem-entry')).toHaveLength(1);expect(ui.queryByText('old scoped answer')).toBeNull();});
 it('S06 JSON parse return retirement blocks history display',()=>{
  seed();JSON.parse=function(text,reviver){mark('parse-entry');actorB();return originalParse(text,reviver);};const ui=mount();expect(entries('parse-entry')).toHaveLength(1);expect(ui.queryByText('old scoped answer')).toBeNull();
 });
 it('S07 clear method lookup retirement preserves stored account history',()=>{seed();const key=historyKey(scope(),'r32-A'),before=memory.get(key);const ui=mount();arm('removeItem-lookup',actorB);fireEvent.click(ui.getByRole('button',{name:getUiString('en','assistant.panel.history.clear')}));expect(entries('removeItem-entry')).toHaveLength(0);expect(memory.get(key)).toBe(before);});
 it('S08 entered storage native rejection is observed without undo claim',async()=>{
  const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);const actual=storage();
  Object.defineProperty(actual,'setItem',{get(){return function setItem(key:string,value:string){mark('entered-setItem-native',key);memory.set(key,value);actorB();return Promise.reject(new Error('entered storage rejection'));};}});
  Object.defineProperty(window,'localStorage',{configurable:true,get(){mark('storage-lookup');return actual;}});await settle(d,reply('ENTERED BEFORE RETIREMENT'));
  expect(entries('entered-setItem-native')).toHaveLength(1);expect(memory.get(historyKey(scope(),'r32-A'))).toContain('ENTERED BEFORE RETIREMENT');expect(ui.queryByText('ENTERED BEFORE RETIREMENT')).toBeNull();
 });
 it('S09 actual functional updater rereads the actor at evaluation',async()=>{
  const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);h.beforeUpdater=()=>{h.beforeUpdater=null;mark('actual-functional-updater-evaluation');actorB();};await settle(d,reply('NO RETIRED VIEW'));
  expect(entries('actual-functional-updater-evaluation')).toHaveLength(1);expect(ui.queryByText('NO RETIRED VIEW')).toBeNull();
  // The storage write occurred before the later actor transition; no rollback is asserted.
  expect(entries('setItem-entry')).toHaveLength(1);
 });
});
describe('r32 NEW live Auth, permanent retirement and adoption',()=>{
 for(const transition of ['actor','null','loading'] as const)it('A01 observed pre-render ABA never revives old form '+transition,()=>{
  const ui=mount();const input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'saved live form'}});const form=input.closest('form');if(!form)throw Error();
  if(transition==='actor')actorB();if(transition==='null')currentAuth().user=null;if(transition==='loading')currentAuth().loading=true;
  fireEvent.submit(form);currentAuth().user=user('r32-A');currentAuth().loading=false;fireEvent.submit(form);expect(h.calls).toHaveLength(0);
 });
 it('A02 a new frozen generation object with equal73 retires old work',async()=>{const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);generation=Object.freeze({value:73});currentAuth().authGeneration=generation;await settle(d,reply('OLD GENERATION'));expect(entries('setItem-entry')).toHaveLength(0);expect(ui.queryByText('OLD GENERATION')).toBeNull();});
 it('A03 public live getters are genuinely current positive inputs',async()=>{
  const base=ownAuth(),principal=user('r32-A');let id='r32-A';Object.defineProperty(principal,'id',{get:()=>id});Object.freeze(principal);Object.defineProperty(base,'user',{get:()=>principal});h.auth=Object.freeze(base);
  const ui=mount();expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);await act(async()=>{submit(ui);await turn();});expect(ui.getByText('r32 current answer')).toBeTruthy();expect(h.calls).toHaveLength(1);
  fireEvent.change(ui.getByRole('textbox'),{target:{value:'another valid question'}});id='r32-B';fireEvent.submit(ui.getByRole('textbox').closest('form')!);expect(h.calls).toHaveLength(1);
 });
 it('A04 throwing public id getter fails closed and stays retired',()=>{
  let throws=false;const principal=user('r32-A');Object.defineProperty(principal,'id',{get(){if(throws)throw Error('live getter');return 'r32-A';}});currentAuth().user=principal;
  const ui=mount(),input=ui.getByRole('textbox');expect(input.hasAttribute('disabled')).toBe(false);fireEvent.change(input,{target:{value:'pending question'}});throws=true;fireEvent.submit(input.closest('form')!);throws=false;fireEvent.submit(input.closest('form')!);expect(h.calls).toHaveLength(0);
 });
 it('A05 reentrant public predicate cannot admit a nested submit',()=>{
  const ui=mount(),input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'reentrant question'}});let nested=false;currentAuth().isAuthGenerationCurrent=function(captured){if(!nested){nested=true;fireEvent.submit(input.closest('form')!);}return captured===generation;};fireEvent.submit(input.closest('form')!);expect(nested).toBe(true);expect(h.calls).toHaveLength(0);
 });
 it('A06 native values returned by Auth getter are observed before denial',()=>{
  const ui=mount(),input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'native getter question'}});Object.defineProperty(currentAuth(),'user',{get(){return Promise.reject(new Error('native Auth getter'));}});fireEvent.submit(input.closest('form')!);expect(h.calls).toHaveLength(0);
 });
 it('A07 native predicate result is observed and never treated as true',()=>{
  const ui=mount(),input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'native predicate question'}});Object.defineProperty(currentAuth(),'isAuthGenerationCurrent',{get(){return function predicate(){return Promise.reject(new Error('native predicate result'));};}});fireEvent.submit(input.closest('form')!);expect(h.calls).toHaveLength(0);
 });
 it('A08 native ask result own then is unread',async()=>{let reads=0;const d=deferred();Object.defineProperty(d.promise,'then',{get(){reads++;throw Error('native own then');}});h.ask=()=>d.promise;const ui=mount();submit(ui);await settle(d);expect(reads).toBe(0);expect(ui.getByText('r32 current answer')).toBeTruthy();});
 it('A09 retired lazy ask result is not read or adopted',async()=>{let reads=0;h.ask=()=>{actorB();return {get then(){reads++;throw Error('retired lazy then');}};};const ui=mount();await act(async()=>{submit(ui);await turn();});expect(reads).toBe(0);expect(h.calls).toHaveLength(1);expect(entries('setItem-entry')).toHaveLength(0);});
 it('A10 queued lazy adoption denies invocation after actor changes',async()=>{let entered=0;h.ask=()=>({then(resolve:(value:unknown)=>void){entered++;resolve(reply());}});const ui=mount();submit(ui);actorB();await act(async()=>{await turn();});expect(entered).toBe(0);expect(entries('setItem-entry')).toHaveLength(0);});
 it('A11 lazy derived native rejection is intrinsically observed',async()=>{h.ask=()=>({then(resolve:(value:unknown)=>void){resolve(reply());return Promise.reject(new Error('derived native result'));}});const ui=mount();await act(async()=>{submit(ui);await turn();});expect(ui.getByText('r32 current answer')).toBeTruthy();});
 it('A12 UUID method lookup retirement blocks UUID and ask entries',()=>{
  let entries=0;const ui=mount();Object.defineProperty(globalThis.crypto,'randomUUID',{configurable:true,get(){actorB();return function createId(){entries++;return 'uuid';};}});submit(ui);expect(entries).toBe(0);expect(h.calls).toHaveLength(0);
 });
 it('A13 entered UUID native rejection is observed before denied outcome',async()=>{
  const ui=mount();Object.defineProperty(globalThis.crypto,'randomUUID',{configurable:true,value:function createId(){actorB();return Promise.reject(new Error('entered UUID'));}});submit(ui);await turn();expect(h.calls).toHaveLength(0);
 });
});
describe('r32 NEW genuine current, lifetime and unchanged AI connection controls',()=>{
 it('C01 citation getter retirement observes entered native rejection',async()=>{
  const citation={id:'id',label:'label',stepId:'step',sourceId:'source',href:'/learn/intro/step'};Object.defineProperty(citation,'label',{get(){actorB();return Promise.reject(new Error('entered citation getter'));}});h.ask=()=>({...reply(),citations:[citation]});const ui=mount();await act(async()=>{submit(ui);await turn();});expect(entries('setItem-entry')).toHaveLength(0);expect(ui.queryByText('r32 current answer')).toBeNull();
 });
 it('C02 actual citation callback requires the live actor',async()=>{
  let calls=0;h.ask=()=>({...reply(),citations:[{id:'id',label:'Current source',stepId:'step',sourceId:'source',href:'/learn/intro/step'}]});const ui=render(common(scope(),'r32-A',()=>{calls++;}));await act(async()=>{submit(ui);await turn();});const citation=ui.getByRole('button',{name:'Current source'});fireEvent.click(citation);expect(calls).toBe(1);actorB();fireEvent.click(citation);expect(calls).toBe(1);
 });
 it('C03 public predicate keeps the actual Auth receiver',async()=>{const receivers:unknown[]=[];currentAuth().isAuthGenerationCurrent=function(captured){receivers.push(this);return captured===generation;};const ui=mount();await act(async()=>{submit(ui);await turn();});expect(h.calls).toHaveLength(1);expect(receivers.length).toBeGreaterThan(0);expect(receivers.every(value=>value===currentAuth())).toBe(true);});
 it('C04 current operations never traverse unused User or session fields',async()=>{let reads=0;const principal=currentAuth().user;if(!principal)throw Error();for(const field of ['email','app_metadata','user_metadata'])Object.defineProperty(principal,field,{get(){reads++;throw Error('unused User field');}});Object.defineProperty(currentAuth(),'session',{get(){reads++;throw Error('unused session');}});const ui=mount();await act(async()=>{submit(ui);await turn();});expect(h.calls).toHaveLength(1);expect(reads).toBe(0);});
 for(const [area,locale] of [['kids','ar-EG'],['technical','ar-MSA'],['academic','ar-Gulf'],['ai','en']] as const)it('P01 actual current area/locale/history namespace '+area,async()=>{
  const s={...scope(area,locale),profileId:'private-profile'};const ui=mount(s);await act(async()=>{submit(ui);await turn();});expect(h.calls).toHaveLength(1);expect(h.calls[0].query).toBe('r32 question');expect(h.calls[0].scope).toEqual(s);expect(ui.getByText('r32 current answer').tagName).toBe('STRONG');
  expect(memory.has(historyKey(s,'r32-A'))).toBe(true);expect(readHistory(historyKey(s,'r32-A'))[0].answer).toBe('**r32 current answer**');
 });
 it('P02 real bounds remain3history/500-1200strings/retained20',async()=>{
  const s=scope();seed(s,'r32-A',Array.from({length:20},(_,i)=>({question:'Q'+i+'x'.repeat(900),answer:'A'+i+'y'.repeat(1400),citations:[]})));const ui=mount(s);await act(async()=>{submit(ui);await turn();});
  expect(h.calls[0].history).toEqual([17,18,19].map(i=>({question:('Q'+i+'x'.repeat(900)).slice(0,500),answer:('A'+i+'y'.repeat(1400)).slice(0,1200)})));const kept=readHistory(historyKey(s,'r32-A'));expect(kept).toHaveLength(20);expect(kept[0].question.startsWith('Q1x')).toBe(true);expect(kept[19].question).toBe('r32 question');
 });
 for(const status of [403,503])it('P03 current status copy remains visible '+status,async()=>{h.ask=()=>({status});const ui=mount();await act(async()=>{submit(ui);await turn();});expect(ui.getByRole('alert').textContent).toBe(getUiString('en',status===403?'assistant.panel.error.access':'assistant.panel.error.connection'));expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);expect(entries('setItem-entry')).toHaveLength(0);});
 it('P04 empty existing error bridge is quiet and releases current busy',async()=>{h.ask=()=>{throw new AssistantRequestError('');};const ui=mount();await act(async()=>{submit(ui);await turn();});expect(ui.queryByRole('alert')).toBeNull();expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);expect(entries('setItem-entry')).toHaveLength(0);});
 it('P05 genuine current request error preserves message',async()=>{h.ask=()=>{throw new AssistantRequestError('genuine r32 failure');};const ui=mount();await act(async()=>{submit(ui);await turn();});expect(ui.getByRole('alert').textContent).toBe('genuine r32 failure');expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);});
 it('P06 malformed current result remains an honest error',async()=>{h.ask=()=>reply('');const ui=mount();await act(async()=>{submit(ui);await turn();});expect(ui.getByRole('alert').textContent).toBe(getUiString('en','assistant.panel.error.connection'));expect(entries('setItem-entry')).toHaveLength(0);});
 it('P07 caller props cannot spoof the private frame',()=>{const props:AssistantConversationPanelProps={scope:scope(),accountId:'r32-A',ask:async()=>reply()};Object.defineProperty(props,'frame',{enumerable:true,value:null});const ui=render(<AssistantConversationPanel {...props}/>);expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);});
 it('D01 harmless Auth and predicate identity churn preserves real draft/history',()=>{seed();const ui=mount(),input=ui.getByRole('textbox');fireEvent.change(input,{target:{value:'preserved draft'}});const reads=entries('getItem-entry').length;h.auth={...currentAuth(),user:user('r32-A'),isAuthGenerationCurrent:function(captured){return captured===generation;}};ui.rerender(common());expect(ui.getByRole('textbox')).toBe(input);expect(input instanceof HTMLTextAreaElement&&input.value).toBe('preserved draft');expect(ui.getByText('old scoped answer')).toBeTruthy();expect(entries('getItem-entry')).toHaveLength(reads);});
 it('D02 observed clear ABA preserves old history until fresh ownership',()=>{seed();const ui=mount();const clear=ui.getByRole('button',{name:getUiString('en','assistant.panel.history.clear')});actorB();fireEvent.click(clear);currentAuth().user=user('r32-A');fireEvent.click(clear);expect(entries('removeItem-entry')).toHaveLength(0);expect(memory.has(historyKey(scope(),'r32-A'))).toBe(true);ui.rerender(common());fireEvent.click(ui.getByRole('button',{name:getUiString('en','assistant.panel.history.clear')}));expect(entries('removeItem-entry')).toHaveLength(1);});
 it('D03 old scope ABA outcome cannot clear a fresh action busy state',async()=>{
  const a=deferred(),b=deferred();let entered=0;h.ask=()=>++entered===1?a.promise:b.promise;const ui=mount();submit(ui,'old question');ui.rerender(common(scope('ai','en','other-card')));ui.rerender(common());submit(ui,'fresh question');expect(h.calls).toHaveLength(2);await settle(a,reply('OLD SCOPE'));expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(true);await settle(b,reply('FRESH SCOPE'));expect(ui.getByText('FRESH SCOPE')).toBeTruthy();expect(ui.queryByText('OLD SCOPE')).toBeNull();expect(ui.queryByRole('alert')).toBeNull();expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);
 });
 it('D04 StrictMode genuine fresh lifetime remains usable',async()=>{const ui=render(<StrictMode>{common()}</StrictMode>);await act(async()=>{submit(ui);await turn();});expect(h.calls).toHaveLength(1);expect(ui.getByText('r32 current answer')).toBeTruthy();});
 it('D05 unmount rejects late output without touching private history',async()=>{const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);ui.unmount();await settle(d,reply('UNMOUNTED'));expect(entries('setItem-entry')).toHaveLength(0);});
 it('D06 genuine new actor ownership uses its own history and fresh form',async()=>{
  seed();const d=deferred();h.ask=()=>d.promise;const ui=mount();submit(ui);actorB();ui.rerender(common(scope(),'r32-B'));expect(ui.queryByText('old scoped answer')).toBeNull();expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);await settle(d,reply('OLD ACCOUNT'));
  h.ask=()=>reply('NEW ACCOUNT');await act(async()=>{submit(ui,'fresh actor question');await turn();});expect(ui.getByText('NEW ACCOUNT')).toBeTruthy();expect(readHistory(historyKey(scope(),'r32-A'))[0].answer).toBe('old scoped answer');expect(readHistory(historyKey(scope(),'r32-B'))[0].answer).toBe('NEW ACCOUNT');
 });
 it('AI01 unchanged AI adapter now closes the post-return storage gap',async()=>{
  const d=deferred();h.runtime=()=>d.promise;const ui=render(<AssistantPanel/>);submit(ui,'new AI connection');expect(h.runtimeCalls).toHaveLength(1);arm('storage-lookup',actorB);await settle(d,runtimeReply());expect(entries('setItem-entry')).toHaveLength(0);expect(ui.queryByText('AI current reply')).toBeNull();expect(ui.queryByRole('alert')).toBeNull();
  if(!h.ctx)throw Error();h.ctx={...h.ctx,currentUser:{id:'r32-B',email:null,isAuthenticated:true}};ui.rerender(<AssistantPanel/>);h.runtime=()=>runtimeReply();expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);await act(async()=>{submit(ui,'fresh AI actor');await turn();});expect(h.runtimeCalls).toHaveLength(2);expect(ui.getByText('AI current reply')).toBeTruthy();expect([...memory.keys()].every(key=>key.includes('r32-B'))).toBe(true);
 });
 it('AI02 unchanged AI adapter preserves genuine current helper failure',async()=>{h.runtime=()=>{throw new AssistantRequestError('current AI connection failure');};const ui=render(<AssistantPanel/>);await act(async()=>{submit(ui,'current AI error');await turn();});expect(ui.getByRole('alert').textContent).toBe('current AI connection failure');expect(ui.getByRole('textbox').hasAttribute('disabled')).toBe(false);expect(entries('setItem-entry')).toHaveLength(0);});
});
