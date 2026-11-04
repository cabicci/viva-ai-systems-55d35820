export const fieldPoints = Array.from({length:16},(_,id)=>({id,x:id%4,y:Math.floor(id/4),excluded:id===3?'wet':id===12?'manure':null}));
export function checkPlan(ids){
 const unique=[...new Set(ids)];
 return unique.length===4&&unique.every(id=>Number.isInteger(id)&&id>=0&&id<16&&!fieldPoints[id].excluded)&&new Set(unique.map(id=>{const p=fieldPoints[id];return `${p.x<2?0:1}${p.y<2?0:1}`})).size===4;
}
const normalize=text=>text.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'').replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}\s]/gu,' ');
const stop=new Set('the a an to is are do does of in why what how i it my for this that not der die das und ein eine mit ist im zu von fur wie was warum il la le di un una e per che come non da هل هو هي في من علي ايه ليه ازاي مش ده دي ما و بن mit'.split(' '));
const tokens=text=>new Set(normalize(text).split(/\s+/).filter(t=>t.length>1&&!stop.has(t)));
export function retrieve(lesson,query){
 const terms=tokens(query);
 if(!terms.size)return null;
 const candidates=lesson.scenes.map(scene=>{
  const related=lesson.faq.filter(x=>x[1]===scene.id).map(x=>x[0]).join(' ');
  const index=tokens(`${scene.title} ${scene.lead} ${scene.example} ${scene.takeaway} ${related}`);
  let score=0;for(const term of terms)if(index.has(term))score++;
  return {scene,score,coverage:score/terms.size};
 }).sort((a,b)=>b.score-a.score||b.coverage-a.coverage);
 const best=candidates[0];
 return best&&best.score>=Math.min(2,terms.size)&&best.coverage>=.45?best.scene:null;
}
