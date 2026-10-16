export const CONTENT_VERSION='S1-01-v1';
export function evaluateDecisions(points,answers){
 const items=points.map(p=>({id:p.id,answered:Number.isInteger(answers[p.id])&&answers[p.id]>=0&&answers[p.id]<p.options.length,correct:answers[p.id]===p.answer}));
 return {total:points.length,answered:items.filter(x=>x.answered).length,correct:items.filter(x=>x.answered&&x.correct).length,passed:items.length>0&&items.every(x=>x.answered&&x.correct),items};
}
export function emptyState(){return {version:CONTENT_VERSION,read:false,practice:{},test:{},testSubmitted:false,attempt:0,quiz:{},quizSubmitted:false,checklist:['','','','',''],reflection:'',selfRating:null,practicalState:'unobserved',trainerSignature:null};}
export function restoreState(raw){
 try{const d=JSON.parse(raw);if(d?.version!==CONTENT_VERSION)return emptyState();const base=emptyState();
  for(const k of ['practice','test','quiz'])if(d[k]&&typeof d[k]==='object'&&!Array.isArray(d[k]))base[k]=Object.fromEntries(Object.entries(d[k]).filter(([id,v])=>/^[a-z0-9-]+$/.test(id)&&Number.isInteger(v)&&v>=0&&v<4));
  for(const k of ['read','testSubmitted','quizSubmitted'])base[k]=d[k]===true;
  base.attempt=Number.isSafeInteger(d.attempt)&&d.attempt>=0?d.attempt:0;
  if(Array.isArray(d.checklist)&&d.checklist.length===5)base.checklist=d.checklist.map(x=>typeof x==='string'?x.slice(0,4000):'');
  base.reflection=typeof d.reflection==='string'?d.reflection.slice(0,4000):'';
  base.selfRating=['can','cannot','partly'].includes(d.selfRating)?d.selfRating:null;
  // Local browser data must never synthesize a trainer sign-off.
  return base;
 }catch{return emptyState();}
}
export function freshAttempt(state){return {...state,test:{},testSubmitted:false,attempt:state.attempt+1};}
export function escapeHtml(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
