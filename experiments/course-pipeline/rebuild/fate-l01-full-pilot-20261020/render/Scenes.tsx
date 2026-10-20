import React,{useState,useEffect} from 'react';
import {AbsoluteFill,Audio,Composition,Img,registerRoot,staticFile,useCurrentFrame,delayRender,continueRender,cancelRender} from 'remotion';
import data from './render-data.json';
const ink='#183b50',blue='#4f8eaa',mint='#d7eee5',gold='#94723b';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
function Scene({scene}:{scene:any}){
 const f=useCurrentFrame(),t=f/30,ar=scene.locale==='ar',n=scene.index;
 const T=(a:string,e:string)=>ar?a:e;
 const [h]=useState(()=>delayRender('Actual platform Cairo font'));
 useEffect(()=>{new FontFace('Cairo',`url("${staticFile('Cairo.ttf')}")`).load().then(x=>{document.fonts.add(x);continueRender(h)}).catch(cancelRender)},[h]);
 const at=(i:number)=>scene.anchors[i].time;
 const p=(i:number,d=.45)=>clamp((t-at(i))/d);
 const reveal=(i:number)=>({opacity:p(i),transform:`translateY(${(1-p(i))*14}px)`});
 const label=(text:string,i:number,size=29)=> <div style={{...reveal(i),fontSize:size,lineHeight:1.65,marginTop:12}}>{text}</div>;
 const box=(text:string,i:number,width=250)=> <div style={{...reveal(i),border:`2px solid ${blue}`,background:'#fff',borderRadius:16,padding:'15px 18px',width,fontSize:30,lineHeight:1.5,textAlign:'center'}}>{text}</div>;
 const num=(text:string,size=65)=> <span dir="ltr" style={{fontSize:size,fontWeight:800,unicodeBidi:'isolate',whiteSpace:'nowrap'}}>{text}</span>;
 const cap=scene.captions.find((c:any)=>t>=c.start&&t<c.end+.08);
 const right:React.CSSProperties={position:'absolute',left:1020,top:220,width:790,height:650,padding:32,background:'rgba(255,255,255,.97)',borderRadius:24,border:'1px solid #c4d6df',direction:ar?'rtl':'ltr'};
 const note:React.CSSProperties={position:'absolute',left:90,top:820,width:820,fontSize:24,lineHeight:1.5,background:'rgba(255,255,255,.95)',padding:'10px 18px',borderRadius:12};
 const route='M775 425 C864 466 899 523 970 556 C1041 589 1105 642 1235 718';
 function point(u:number){const pts=u<.5?[[775,425],[864,466],[899,523],[970,556]]:[[970,556],[1041,589],[1105,642],[1235,718]];let q=u<.5?u*2:(u-.5)*2,v=1-q;return [0,1].map(a=>v*v*v*pts[0][a]+3*v*v*q*pts[1][a]+3*v*q*q*pts[2][a]+q*q*q*pts[3][a])}
 return <AbsoluteFill style={{fontFamily:'Cairo',letterSpacing:0,background:'#f9fcfc',color:ink,direction:ar?'rtl':'ltr'}}>
  <Audio src={staticFile(scene.audio)}/>
  <Img src={staticFile(scene.image)} style={{position:'absolute',inset:0,width:1920,height:1080,objectFit:'cover'}}/>
  <div style={{position:'absolute',left:0,right:0,top:0,height:180,background:'linear-gradient(#f9fcfc 65%,rgba(249,252,252,0))'}}/>
  <Img src={staticFile('masaarat-logo-lockup.png')} style={{position:'absolute',left:70,top:38,width:180,height:80,objectFit:'contain'}}/>
  <header style={{position:'absolute',right:85,top:30,width:1460,textAlign:ar?'right':'left',paddingLeft:ar?0:50}}>
   <div style={{fontSize:23,color:'#4b7184'}}>{T('مسار مصير المبيدات · محطة المتبقيات والتعرّض · الخطوة الأولى','Fate of pesticides · Residues and exposure · Step 1')} <span dir="ltr"> · {n+1}/10</span></div>
   <div style={{fontSize:43,fontWeight:800,lineHeight:1.5,marginTop:9}}>{scene.title}</div>
  </header>
  {n===0&&<>
   <div style={right}>
    <div style={{fontSize:28,fontWeight:800}}>{T('تقرير العيّنة: إيه اللي نعرفه؟','Sample report: what do we know?')}</div>
    <div style={{...reveal(0),marginTop:22,borderBottom:`3px solid ${blue}`,paddingBottom:18,fontSize:36}}>{T('مادة محددة اتقاست في العينة','A specified substance was measured')}</div>
    <div style={{display:'flex',gap:14,marginTop:40}}>{[T('مين أكل؟','Who ate it?'),T('أكل قد إيه؟','How much?'),T('إيه الأثر؟','What effect?')].map((x,i)=><div key={i} style={{...reveal(i+1),flex:1,textAlign:'center',padding:'24px 8px',border:'2px dashed #b4cbd5',borderRadius:15}}><div style={{fontSize:55,color:gold}}>?</div><div style={{fontSize:25}}>{x}</div></div>)}</div>
    <div style={{...reveal(4),fontSize:32,fontWeight:800,marginTop:30,background:mint,padding:15,borderRadius:12}}>{T('نتيجة تحليل ≠ تشخيص تسمّم','Laboratory result ≠ poisoning diagnosis')}</div>
   </div>
   <div style={note}>{T('عينة غذاء للتحليل — المشهد مش وصفًا لطريقة سحب أو استخلاص معتمدة','Food sample context — not a validated sampling or extraction procedure')}</div>
  </>}
  {n===1&&<>
   <svg viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
    {[0,1,2,3].map((_,i)=><circle key={i} cx={345+i*84} cy={490+(i%2)*65} r={16} fill="white" stroke={blue} strokeWidth={5} opacity={p(0)}/>)}
    {[0,1,2].map((_,i)=><path key={i} d={`M${430+i*80} ${660-i*35} l17 30 h-34 Z`} fill="#f2e5cf" stroke={gold} strokeWidth={3} opacity={p(1)}/>)}
   </svg>
   <div style={right}>
    <div style={{fontSize:24,fontWeight:700}}>{T('رموز توضيحية — مش جزيئات بالحجم أو الشكل الحقيقي','Schematic markers — not actual molecular shapes or size')}</div>
    <div style={{display:'flex',gap:18,marginTop:35}}>{box(T('○ المادة الأصلية','○ Parent'),0,300)}{box(T('△ ناتج تحوّل محدد','△ Specified product'),1,300)}</div>
    <div style={{...reveal(2),marginTop:40,padding:22,border:'2px solid #a8c1ce',borderRadius:16,fontSize:28}}>{T('المعمل قاس: ○ فقط','Laboratory measures: ○ only')}</div>
    <div style={{...reveal(3),marginTop:18,padding:22,border:`2px solid ${gold}`,borderRadius:16,fontSize:28}}>{T('المرجع يشمل: ○ + △','Reference includes: ○ + △')}</div>
    {label(T('لازم نوفّق تعريف المتبقي قبل المقارنة','Reconcile the residue definition before comparison'),3,29)}
   </div>
   <div style={note}>{T('وجود المتبقي مش شرط يكون طبقة نقدر نشوفها','A residue need not form a visible coating')}</div>
  </>}
  {n===2&&<>
   <svg viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
    <path d="M490 390 C680 255 960 245 1120 320" fill="none" stroke={gold} strokeWidth={5} strokeDasharray="13 10" opacity={p(0)*(1-p(1))}/>
    <path d={route} fill="none" stroke="white" strokeWidth={19} pathLength={1} strokeDasharray={`${p(1,4)} 1`} opacity={p(1)}/>
    <path d={route} fill="none" stroke={blue} strokeWidth={11} pathLength={1} strokeDasharray={`${p(1,4)} 1`} opacity={p(1)}/>
    {Array.from({length:9},(_,i)=>{let u=clamp((t-at(1)-i*.28)/4);let [x,y]=point(u);return <ellipse key={i} cx={x} cy={y} rx={8} ry={4} fill="white" opacity={p(1)*(u<1?1:0)}/>})}
    {(()=>{let [x,y]=point(p(1,4));return <circle cx={x} cy={y} r={15} fill="#fff8e7" stroke={gold} strokeWidth={4} opacity={p(1)}/>})()}
    <path d="M580 330 C820 190 1030 230 1290 410" fill="none" stroke={gold} strokeWidth={5} strokeDasharray="10 9" opacity={p(3)}/>
   </svg>
   <div style={{...right,top:245,left:1330,width:480,height:540,fontSize:29}}>
    {label(T('غذاء ← تناول','Food → consumption'),0)}
    {label(T('تربة ← جريان ← مياه','Soil → runoff → water'),1)}
    {label(T('هل وصلت؟ وبأي تركيز؟','Did it arrive? At what concentration?'),2)}
    {label(T('انجراف رذاذ خارج الهدف','Spray drift beyond the target'),3)}
    <div style={{...reveal(4),fontWeight:800,background:mint,padding:16,marginTop:25,borderRadius:12}}>{T('سهم الانتقال ≠ دليل ضرر','Movement arrow ≠ evidence of harm')}</div>
   </div>
   <div style={{...note,top:826,width:1080,fontSize:22}}>{T('الأزرق لحركة المياه؛ الدائرة علامة تتبّع افتراضية. المسارات محتملة، مش قياسات فعلية.','Blue shows water motion; the circle is a schematic tracer. Routes are possibilities, not measurements.')}</div>
  </>}
  {n===3&&<>
   <div style={{...right,left:480,width:1310,top:245,height:650}}>
    <div style={{display:'flex',gap:30,direction:'ltr',marginTop:25}}>
     {[{a:'القدرة على إحداث ضرر',e:'Hazard',b:'نوع الأثر وظروفه',f:'Effect and conditions'},{a:'التعرّض',e:'Exposure',b:'المقدار · الطريق · المدة',f:'Amount · route · duration'},{a:'المخاطر',e:'Risk',b:'احتمال الأثر وشدّته في الحالة',f:'Likelihood and severity in this case'}].map((x,i)=><div key={i} style={{...reveal(i),flex:1,padding:25,border:`2px solid ${blue}`,borderRadius:20,textAlign:'center',direction:ar?'rtl':'ltr'}}><div style={{fontSize:62,color:blue}}>{['◉','↗','?'][i]}</div><h2 style={{fontSize:32,margin:'12px 0'}}>{T(x.a,x.e)}</h2><p style={{fontSize:27,margin:0}}>{T(x.b,x.f)}</p></div>)}
    </div>
    <div style={{...reveal(3),marginTop:36,fontSize:30,padding:'16px 25px',background:mint,borderRadius:12}}>{T('هل دليل الدراسة ينطبق على ظروف التعرّض هنا؟','Does the study evidence apply to these exposure conditions?')}</div>
    {label(T('غياب الأعراض الفورية لا يستبعد كل أثر محتمل','No immediate symptoms does not rule out every possible effect'),4,26)}
   </div>
  </>}
  {n===4&&<>
   <div style={right}>
    <div style={{fontSize:24,color:blue}}>{T('مثال افتراضي بالكامل','Entirely hypothetical example')}</div>
    <div style={{...reveal(0),display:'flex',alignItems:'center',justifyContent:'center',gap:28,marginTop:15,direction:'ltr'}}>{num('0.08',89)}<div style={{textAlign:'center',fontSize:39}}><div>mg</div><div style={{height:3,background:blue}}/><div>kg</div></div></div>
    <div style={{...reveal(1),fontSize:36,textAlign:'center',background:mint,padding:6,borderRadius:12,marginTop:14}}>{T('كيلوجرام غذاء','kilogram of FOOD')}</div>
    <div style={{...reveal(2),fontSize:28,marginTop:20}}>{T('الحد المطابق في التدريب:','Matching training limit:')} {num('0.10 mg/kg',34)}</div>
    <div style={{...reveal(3),display:'flex',flexWrap:'wrap',gap:10,marginTop:24}}>{T('المادة|التعريف|السلعة|الجزء|الوحدة','Substance|Definition|Commodity|Portion|Unit').split('|').map(x=><div key={x} style={{padding:'7px 13px',border:'1px solid #96b5c4',borderRadius:8,fontSize:24}}>{x}</div>)}</div>
    {label(T('حدّ التفاح ما يتنقلش للطماطم','An apple limit cannot be transferred to tomatoes'),4,26)}
   </div>
   <div style={{...note,opacity:p(1)}}>{T('التركيز في الغذاء ≠ جرعة لكل كيلوجرام من وزن الجسم','Food concentration ≠ dose per kilogram of body mass')}</div>
  </>}
  {n===5&&<>
   <div style={{...right,left:280,width:1510,height:650}}>
    <div style={{fontSize:25,color:blue}}>{T('مقارنة على أساس ووحدة متطابقين — مثال افتراضي','Same basis and units — hypothetical comparison')}</div>
    <svg width="1400" height="270" viewBox="0 0 1400 270" style={{direction:'ltr',marginTop:18}}>
     <line x1="70" y1="155" x2="1320" y2="155" stroke={ink} strokeWidth={4}/>
     {[0,.02,.04,.06,.08,.10,.12].map((x,i)=><g key={i}><line x1={70+i*200} x2={70+i*200} y1={144} y2={168} stroke={ink} strokeWidth={3}/><text x={70+i*200} y={207} textAnchor="middle" fill={ink} fontSize="29">{x.toFixed(2)}</text></g>)}
     <g opacity={p(0)}><circle cx="870" cy="155" r="15" fill={blue}/><text x="870" y="110" textAnchor="middle" fill={ink} fontSize="44">0.08</text><path d="M1070 125 V180" stroke={gold} strokeWidth={6}/><text x="1070" y="110" textAnchor="middle" fill={ink} fontSize="44">0.10</text></g>
     <g opacity={p(1)}><path d="M870 45 V30 H1070 V45" fill="none" stroke={blue} strokeWidth={4}/><text x="970" y="22" textAnchor="middle" fill={ink} fontSize="24">Δ 0.02 mg/kg</text></g>
    </svg>
    <div style={{...reveal(0),fontSize:36,fontWeight:800,textAlign:'center'}}>{T('القيمة أقل من الحد الافتراضي','The value is below the illustrative limit')}</div>
    <div style={{display:'flex',gap:24,marginTop:26}}>{box(T('الفرق ≠ هامش أمان لشخص','Difference ≠ personal safety allowance'),2,680)}{box(T('الحد مرجع لتركيز في سلعة','The limit is a commodity concentration reference'),3,680)}</div>
    {label(T('تجاوز الحد وحده لا يشخّص تسمّمًا','Exceedance alone does not diagnose poisoning'),4,26)}
   </div>
  </>}
  {n===6&&<>
   <div style={right}>
    <div style={{...reveal(0),fontSize:31}}>{T('حصة من نفس الطماطم','A portion of the same tomatoes')}</div>
    <div style={{...reveal(1),marginTop:12,padding:12,textAlign:'center',background:mint,borderRadius:15}}>{num('200 g = 0.20 kg',42)}</div>
    <div dir="ltr" style={{...reveal(2),display:'flex',gap:16,alignItems:'center',justifyContent:'center',marginTop:20,fontSize:36}}><div style={{textAlign:'center'}}><div>0.08 mg</div><div style={{height:3,background:blue}}/><div style={{textDecoration:p(3)?'line-through':'none',textDecorationColor:gold}}>kg food</div></div><div>×</div><div>0.20 <span style={{textDecoration:p(3)?'line-through':'none',textDecorationColor:gold}}>kg food</span></div></div>
    <div style={{...reveal(4),textAlign:'center',marginTop:12}}>{num('= 0.016 mg',54)}<div style={{fontSize:28}}>{T('في الحصة','in the portion')}</div></div>
    <div style={{...reveal(4),fontSize:24,marginTop:12,borderTop:'1px solid #c4d6df',paddingTop:12}}>{T('كمية متناولة ≠ كمية ممتصة ≠ تقدير مخاطر','Ingested amount ≠ absorbed amount ≠ risk assessment')}</div>
   </div>
   <div style={note}>{T('نفترض ثبات التركيز في الحصة — الأرقام تعليمية','Assume the portion has the example concentration — teaching values')}</div>
  </>}
  {n===7&&<>
   <div style={right}>
    <div style={{fontSize:25,color:blue}}>{T('نفحص منطق الادعاء','Examine the reasoning')}</div>
    <div style={{...reveal(1),fontSize:31,lineHeight:1.7,padding:18,border:`2px solid ${gold}`,borderRadius:15}}>{T('وجود المادة في «أي» غذاء يثبت حدوث الأثر؟','An effect must occur “whenever” the substance is detected?')}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:26}}>{[T('أنهي دراسة؟','Which study?'),T('أنهي كائن وأثر؟','Which organism / endpoint?'),T('جرعة · طريق · مدة','Dose · route · duration'),T('هوية المادة صحيحة؟','Correct chemical identity?')].map((x,i)=><div key={i} style={{...reveal(i<2?2:i===2?3:4),borderBottom:'3px solid #a8c8d8',padding:'16px 8px',fontSize:27,lineHeight:1.5}}>{x}</div>)}</div>
    {label(T('الجدول بداية للتحقق، مش تشخيص جاهز','The table starts an investigation; it is not a diagnosis'),4,28)}
   </div>
   <div style={note}>{T('جدول المصدر: الصف وحده لا يعرض تفاصيل الدليل اللازمة','Source table: a row alone omits essential evidence details')}</div>
  </>}
  {n===8&&<>
   <div style={{...right,left:880,width:910}}>
    <div style={{...reveal(0),fontSize:27,color:blue}}>FAO / WHO · JMPR</div>
    <div style={{display:'grid',gap:15,marginTop:20}}>{[T('تقييم الدراسات والأدلة','Evaluate studies and evidence'),T('جهات المعايير والحكومات','Standards bodies and governments'),T('استخدام مصرّح به وشروطه','Authorized use and its conditions')].map((x,i)=><div key={i} style={{...reveal(i+1),padding:'20px 25px',fontSize:31,border:`2px solid ${blue}`,borderRadius:16,marginInlineStart:i*35}}>{x}<span style={{float:ar?'left':'right',color:blue}}>{i<2?'↓':''}</span></div>)}</div>
    <div style={{...reveal(4),marginTop:25,fontSize:27,padding:18,background:mint,borderRadius:12}}>{T('نتيجة المعمل لا تحدد جرعة رش أو موعد حصاد','A laboratory result does not supply an application rate or harvest interval')}</div>
   </div>
  </>}
  {n===9&&<>
   <div style={right}>
    <div style={{fontSize:25,color:blue}}>{T('حالة جديدة — كل القيم افتراضية','New case — all values are hypothetical')}</div>
    <div style={{marginTop:25,display:'grid',gap:18}}>{[[T('التركيز','Concentration'),'0.06 mg/kg',1],[T('الحد المطابق','Matching limit'),'0.05 mg/kg',2],[T('الحصة','Portion'),'150 g',3]].map(([a,b,i])=><div key={a} style={{...reveal(Number(i)),display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:29,padding:'12px 20px',borderBottom:'1px solid #bad0db'}}><span>{a}</span>{num(String(b),42)}</div>)}</div>
    <div style={{...reveal(4),fontSize:30,lineHeight:1.9,padding:20,background:mint,borderRadius:14,marginTop:28}}>{T('وقّف الفيديو: قارن، احسب، وحدّد الاستنتاج اللي الدليل لا يثبته.','Pause: compare, calculate, and identify a conclusion the evidence cannot support.')}</div>
   </div>
   <div style={{...note,opacity:p(4)}}>{T('اكتب خطواتك ووحداتك؛ الإجابة في ورقة التدريب للمراجعة','Write your reasoning and units in the worksheet for review')}</div>
  </>}
  <div style={{position:'absolute',left:85,right:85,bottom:28,height:112,background:'rgba(250,253,253,.98)',borderRadius:16,borderTop:'2px solid #c5d8df',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px 35px',textAlign:'center',fontSize:31,lineHeight:1.55}}>{cap?.text??''}</div>
  <div style={{position:'absolute',bottom:0,left:0,height:5,width:`${100*f/scene.frames}%`,background:blue}}/>
 </AbsoluteFill>
}
registerRoot(()=> <>{data.scenes.map((scene:any)=><Composition key={scene.id} id={scene.id} component={Scene} defaultProps={{scene}} durationInFrames={scene.frames} fps={30} width={1920} height={1080}/>)}</>);
