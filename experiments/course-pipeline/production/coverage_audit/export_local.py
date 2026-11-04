"""Validate and export the read-only source audit; never mutates a lesson."""
import collections,datetime,json,sys
from pathlib import Path
import worker as w
import manual_findings as mf

DEST=Path('E:/Masaarat/Deliverables/soil-coverage-audit-20261013')
CANVAS=Path('C:/Users/HI-TECH/.cursor/projects/e-Masaarat-viva-ai-systems-55d35820/canvases/soil-coverage-audit.canvas.tsx')
LABELS={'covered':'مغطّى بالدليل','partial':'مغطّى جزئيًا','missing':'لم يُعثر على تغطيته','equivalent':'نشاط بديل — اختلاف عن الأصل','modified':'معلومة معدّلة — اختلاف عن الأصل','unverified':'غير محسوم — دليل غير مثبت'}
KINDS={'objective':'هدف','concept':'مفهوم','procedure':'إجراء','safety':'سلامة','formula':'معادلة','worked_example':'مثال محلول','exercise':'تمرين','assessment':'تقييم','diagram':'رسم أو جدول'}
ROLES={'written':'شرح مكتوب','narration':'نص فيديو','activity':'نشاط','assessment':'سؤال وتغذية راجعة','trainer-record':'سجل المدرب'}
DETAIL_PAGES=[18,21,38,40,47,59,62,68,71,75,80,94,100,101,105,115,119,123,129,130,132,133,142,143]

def export():
 req,source=w.configure();pool=w.fields();pages={p['page']:p['text'] for p in source['pages']}
 plan=w.p.read(w.ROOT.parent/'planning/curriculum-map.json');steps={s['id']:s for s in plan['lessons']};units={u['id']:u for u in plan['units']}
 rows=[];ledger={}
 for block in range(1,26):
  inv=w.p.read(w.OUT/f'inventory-{block:02}.json');result=w.p.read(w.OUT/f'confirmed-{block:02}.json');local=w.p.read(w.OUT/f'locales-{block:02}.json')
  assert result['globalAbsenceChecked'] and result['snapshotDigest']==w.p.digest(req['contentHashes'])
  items={i['itemId']:i for i in inv['items']};w.validate_matches(result['rows'],inv['items'],pool)
  checks={(c['itemId'],c['locale']):c for c in local['checks']}
  assert len(checks)==len(items)*3
  for note in inv['pageNotes']:
   assert note['page'] not in ledger;ledger[note['page']]=note
  for match in result['rows']:
   item=items[match['itemId']];assert w.contains(pages[item['page']],item['quote'])
   for e in item.get('sourceEvidence',[]):assert w.contains(pages[e['page']],e['quote'])
   station='U1' if item['page']<=35 else 'U2' if item['page']<=86 else 'U3'
   localized=[]
   for loc in ['ar-EG','it','de']:
    check=checks[(item['itemId'],loc)]
    for e in check.get('evidence',[]):
     actual=w.pointer(w.p.read(w.PRIVATE/'snapshot'/e['step']/(loc+'.json')),e['path']);assert w.contains(actual,e['text'])
    localized.append(check)
   evidence=[]
   for e in match['evidence']:
    evidence.append({**e,'stepTitle':steps.get(e['step'],{}).get('title',e['step']),'roleAR':ROLES[e['role']]})
   rows.append({**item,**match,'evidence':evidence,'statusAR':LABELS[match['status']],'kindAR':KINDS[item['kind']],'station':station,'stationTitle':units[station]['title'],'locales':localized,'sourceVisualOverviewReviewed':True,'sourceVisualDetailReviewed':item['page'] in DETAIL_PAGES,'humanReviewed':False})
 extra=mf.supplement();assert w.contains(pages[extra['page']],extra['quote'])
 for e in extra['evidence']:assert w.contains(pool[e['fieldId']]['text'],e['quote'])
 extra.update(statusAR=LABELS[extra['status']],kindAR=KINDS[extra['kind']],station='U1',stationTitle=units['U1']['title'],sourceVisualOverviewReviewed=True,sourceVisualDetailReviewed=True)
 extra['evidence']=[{**e,'stepTitle':steps[e['step']]['title'],'roleAR':ROLES[e['role']]} for e in extra['evidence']]
 rows=mf.annotate(rows+[extra])
 for row in rows:
  if row.get('rejectedEvidence') and row['status']=='missing':
   row['status']='unverified'
   row['reasonAR']='طُرح موضع محتمل للتغطية، لكن اقتباسه لم يثبت في الحقل المحدد. لا يُحكم بالغياب النهائي بناءً على هذا الاقتراح.'
  row['statusAR']=LABELS[row['status']]
 assert set(ledger)==set(range(1,147)) and len({r['itemId'] for r in rows})==len(rows)
 rows.sort(key=lambda r:(r['page'],r['itemId']))
 counts=dict(collections.Counter(r['status'] for r in rows));locale_counts={loc:dict(collections.Counter(c['status'] for r in rows for c in r['locales'] if c['locale']==loc)) for loc in ['ar-EG','it','de']}
 metadata={'auditId':req['auditId'],'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':'Fundamentals of Soil and Crops_4Printing.pdf','sourceSha256':req['sourceSha256'],'physicalPages':146,'sourcePath':str(w.PRIVATE/'original-en.pdf'),'frozenContentFiles':136,'steps':34,'teachingSteps':30,'assessmentItems':4,'stations':3,'snapshotDigest':w.p.digest(req['contentHashes']),'statusCounts':counts,'localeCounts':locale_counts,'sourceVisualOverviewPages':146,'sourceVisualDetailPages':DETAIL_PAGES,'humanReviewed':False,'institutionallyApproved':False,'scopeAR':'مطابقة الملف الإنجليزي الأساسي مع الشرح والأنشطة والأسئلة وسجلات المدرب ونصوص الفيديو الفعلية. لم تُراجع نسختا المعلم وبنك الأسئلة في هذه المهمة. مراجعة نص الفيديو لا تثبت تنفيذ كل مشهد داخل MP4، ومقارنة اللغة لا تعادل مراجعة متخصص أو متحدث أصلي.','countMeaningAR':'عدد البنود يشمل تكرار الهدف أو الإجراء في صفحات مختلفة. ليس نسبة اكتمال للمنهج أو قياسًا لكفاءة الطالب.','sourceDifferencesAR':'النشاط البديل والمعلومة المعدلة اختلافان موثّقان؛ لا يُحسبان تطابقًا مع الأصل ولا اعتمادًا تلقائيًا للتغيير. تغيير موديل المعدة سبق أن سمح به المستخدم؛ تفاصيل المطابقة الفنية تظل قابلة للمراجعة.'}
 data={'metadata':metadata,'rows':rows,'pageLedger':[ledger[n] for n in sorted(ledger)],'sourceQualityNotes':mf.SOURCE_QUALITY_NOTES}
 DEST.mkdir(parents=True,exist_ok=True);(DEST/'coverage-audit.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
 (DEST/'page-ledger.json').write_text(json.dumps(data['pageLedger'],ensure_ascii=False,indent=2),encoding='utf-8')
 header='import {useState,useMemo,useHostTheme,H1,H2,Text,Row,Stack,Grid,Stat,Table,TextInput,Select,Button,Callout,Divider} from "cursor/canvas";\nconst DATA: {metadata:any;rows:any[];pageLedger:any[];sourceQualityNotes:any[]} = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
 CANVAS.write_text(header+CANVAS_BODY,encoding='utf-8',newline='\n')
 print(json.dumps({'rows':len(rows),'counts':counts,'locales':locale_counts,'archive':str(DEST),'canvas':str(CANVAS)},ensure_ascii=False))

CANVAS_BODY=r'''
const STATUS: Record<string,string> = {all:"كل الحالات",issues:"النواقص والاختلافات",covered:"مغطّى بالدليل",partial:"مغطّى جزئيًا",missing:"لم يُعثر على تغطيته",equivalent:"نشاط بديل",modified:"معلومة معدّلة",unverified:"غير محسوم — دليل غير مثبت"};
const LOCALE: Record<string,string> = {aligned:"المعنى متوافق في الدليل المحدد",partial:"المعنى منقول جزئيًا",mismatch:"اختلاف في المعنى",not_assessed:"لم يمكن تقييمه"};
export default function CoverageAudit(){
 const theme=useHostTheme();const [query,setQuery]=useState("");const [status,setStatus]=useState("issues");const [station,setStation]=useState("all");const [kind,setKind]=useState("all");const [pageFilter,setPageFilter]=useState("");const [page,setPage]=useState(0);const [selected,setSelected]=useState<any>(null);const [view,setView]=useState("items");
 const filtered=useMemo(()=>DATA.rows.filter(r=>(status==="all"||(status==="issues"?r.status!=="covered":r.status===status))&&(station==="all"||r.station===station)&&(kind==="all"||r.kind===kind)&&(!pageFilter||String(r.page)===pageFilter)&&(!query||JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))),[query,status,station,kind,pageFilter]);
 const size=25;const current=Math.min(page,Math.max(0,Math.ceil(filtered.length/size)-1));const slice=filtered.slice(current*size,(current+1)*size);
 const change=(setter:(v:string)=>void)=>(value:string)=>{setter(value);setPage(0);setSelected(null)};
 const details=selected;const counts=DATA.metadata.statusCounts;
 return <div dir="rtl" style={{padding:24,color:theme.text.primary,background:theme.bg.editor,fontFamily:"Tajawal, Arial, sans-serif"}}>
  <Stack gap={16}>
   <H1>مطابقة منهج التربة والمحاصيل مع المحتوى المنتج</H1>
   <Text style={{color:theme.text.secondary}}>المرجع الإنجليزي الأساسي · ١٤٦ صفحة · ٣ محطات · ٣٠ خطوة تدريس و٤ عناصر تقييم · نسخة محتوى ثابتة بتاريخ ١٣ أكتوبر ٢٠٢٦</Text>
   <Callout>كل حكم مرتبط باقتباس من الأصل وبموضع فعلي في المحتوى. البدائل والتعديلات تظهر كاختلافات عن المنهج. هذه مراجعة آلية مع فحص الأدلة بواسطة الوكيل، وليست اعتمادًا علميًا أو مراجعة بشرية.</Callout>
   <Row gap={26} wrap><Stat value={DATA.rows.length} label="بنود تعليمية مستخرجة"/>{Object.entries(counts).map(([key,value])=><Stat key={key} value={String(value)} label={STATUS[key]}/>)}</Row>
   <Text style={{color:theme.text.tertiary}}>{DATA.metadata.countMeaningAR}</Text>
   <Row gap={8}><Button onClick={()=>setView("items")}>جدول البنود والأدلة</Button><Button onClick={()=>setView("pages")}>سجل صفحات الأصل</Button></Row>
   {view==="items"&&<>
    <Grid columns="repeat(auto-fit,minmax(170px,1fr))" gap={10}>
     <div><Text>بحث في البند والدليل والنقص</Text><TextInput value={query} onChange={change(setQuery)} placeholder="مثال: pH أو أخذ العينة"/></div>
     <div><Text>حالة المطابقة</Text><Select value={status} onChange={change(setStatus)} options={Object.entries(STATUS).map(([value,label])=>({value,label}))}/></div>
     <div><Text>المحطة</Text><Select value={station} onChange={change(setStation)} options={[{value:"all",label:"كل المحطات"},...Array.from(new Map(DATA.rows.map(r=>[r.station,r.stationTitle])).entries()).map(([value,label])=>({value:String(value),label:String(label)}))]}/></div>
     <div><Text>نوع البند</Text><Select value={kind} onChange={change(setKind)} options={[{value:"all",label:"كل الأنواع"},...Array.from(new Map(DATA.rows.map(r=>[r.kind,r.kindAR])).entries()).map(([value,label])=>({value:String(value),label:String(label)}))]}/></div>
     <div><Text>رقم صفحة PDF الأصلية</Text><TextInput type="number" value={pageFilter} onChange={change(setPageFilter)} placeholder="١–١٤٦"/></div>
    </Grid>
    <Row gap={12} wrap><Text>البنود المطابقة للفلاتر: {filtered.length}</Text>{filtered.length>0&&<><Button disabled={current===0} onClick={()=>setPage(current-1)}>السابق</Button><Text>صفحة {current+1} من {Math.ceil(filtered.length/size)}</Text><Button disabled={(current+1)*size>=filtered.length} onClick={()=>setPage(current+1)}>التالي</Button></>}<Button onClick={()=>{setQuery("");setStatus("all");setStation("all");setKind("all");setPageFilter("");setPage(0);setSelected(null)}}>عرض كل البنود</Button></Row>
    {slice.length>0&&<Table striped stickyHeader columnAlign={["right","right","right","right","right"]} headers={["صفحة الأصل / النوع","المطلب التعليمي","حالة التغطية","مكان الدليل","التفاصيل"]} rows={slice.map(r=>[<Text key="page">{r.page} · {r.kindAR}</Text>,<div key="req" style={{minWidth:250,maxWidth:440}}>{r.requirementAR}</div>,<Text key="state">{r.statusAR}</Text>,<div key="where" style={{minWidth:190,maxWidth:280}}>{Array.from(new Set(r.evidence.map((e:any)=>e.stepTitle+" — "+e.roleAR))).join("؛ ")||"لم يُعثر على دليل فعلي"}</div>,<Button key="detail" onClick={()=>setSelected(r)}>افتح الدليل والنقص</Button>])}/>}
    {details&&<section style={{borderTop:"1px solid "+theme.stroke.primary,paddingTop:18}}>
     <H2>صفحة {details.page}: {details.requirementAR}</H2>
     <Text>{details.statusAR} · {details.stationTitle}</Text>
     <p style={{color:theme.text.secondary}}>{details.reasonAR}</p>
     {details.gapAR&&<Callout>التفاصيل الناقصة: {details.gapAR}</Callout>}
     {details.deviationAR&&<p>الاختلاف عن الأصل: {details.deviationAR}</p>}
     {details.sourceContextAR&&<p>سياق الأصل: {details.sourceContextAR}</p>}
     {details.rootReviewNoteAR&&<Callout>فحص الوكيل للدليل: {details.rootReviewNoteAR}</Callout>}
     <H2>المطلب واقتباس الأصل</H2><p dir="ltr" style={{textAlign:"left",whiteSpace:"pre-wrap"}}>{details.requirementEN}</p>
     {(details.sourceEvidence||[{page:details.page,quote:details.quote}]).map((e:any,i:number)=><blockquote key={i} dir="ltr" style={{textAlign:"left",borderLeft:"2px solid "+theme.stroke.primary,paddingLeft:14,whiteSpace:"pre-wrap"}}>PDF page {e.page}: {e.quote}</blockquote>)}
     {details.visualSourceTranscriptionEN&&<p dir="ltr" style={{textAlign:"left",whiteSpace:"pre-wrap"}}>Visual content transcribed by the agent: {details.visualSourceTranscriptionEN}</p>}
     {details.evidence.length>0&&<><H2>الدليل الفعلي في المحتوى</H2>{details.evidence.map((e:any,i:number)=><div key={i} style={{padding:"12px 0",borderBottom:"1px solid "+theme.stroke.tertiary}}><Text>{e.stepTitle} · {e.roleAR}</Text><p dir="ltr" style={{textAlign:"left",color:theme.text.tertiary,overflowWrap:"anywhere"}}>{e.step}{e.path}</p><blockquote dir="ltr" style={{textAlign:"left",whiteSpace:"pre-wrap"}}>{e.quote}</blockquote></div>)}</>}
     <H2>مطابقة المعنى في النسخ الثلاث الأخرى</H2>
     <Table columnAlign={["right","right","right"]} headers={["اللغة","النتيجة في الحقول المقابلة","التفسير"]} rows={details.locales.map((c:any)=>[c.locale==="ar-EG"?"المصري":c.locale==="it"?"الإيطالي":"الألماني",LOCALE[c.status],c.reasonAR])}/>
     {details.locales.some((c:any)=>c.evidence?.length>0)&&<details><summary>افتح اقتباسات النسخ الثلاث المقابلة</summary>{details.locales.filter((c:any)=>c.evidence?.length>0).map((c:any)=><div key={c.locale}><Text>{c.locale}</Text>{c.evidence.map((e:any,i:number)=><blockquote key={i} dir={c.locale==="ar-EG"?"rtl":"ltr"} style={{whiteSpace:"pre-wrap",textAlign:c.locale==="ar-EG"?"right":"left"}}>{e.text}</blockquote>)}</div>)}</details>}
     <p style={{color:theme.text.tertiary}}>فحص صور الأصل: {details.sourceVisualDetailReviewed?"هذه الصفحة فُحصت بصورة كاملة أيضًا":"عرض عام للصفحة؛ التفاصيل النصية راجعتها المطابقة"}. اقتباس نص الفيديو يثبت النص المكتوب فقط، ولا يثبت التشغيل أو العرض داخل MP4.</p>
     <Button onClick={()=>setSelected(null)}>اقفل التفاصيل</Button>
    </section>}
   </>}
   {view==="pages"&&<><H2>سجل كل صفحات المرجع الأصلي</H2><Text>الغلاف والفهرس والمراجع مسجّلة؛ لا تتحول إلى خطوات مستقلة. الصفحات التعليمية قد تكرر هدفًا أو مهارة.</Text><Table striped stickyHeader columnAlign={["right","right","right","right"]} headers={["صفحة PDF","تصنيف الصفحة","عدد البنود","ملاحظة المراجعة"]} rows={DATA.pageLedger.map(p=>[p.page,({instruction:"محتوى تعليمي",title:"غلاف أو تقديم محطة",contents:"فهرس",references:"مراجع"} as any)[p.classification],DATA.rows.filter(r=>r.page===p.page).length,p.noteAR])}/></>}
   <Divider/>
   <H2>ملاحظات داخل المرجع نفسه</H2><Table headers={["صفحة الأصل","الملاحظة المسجلة"]} columnAlign={["right","right"]} rows={DATA.sourceQualityNotes.map(n=>[n.page,n.noteAR])}/>
   <H2>حدود التقرير ومصدره</H2><Text>{DATA.metadata.scopeAR}</Text><Text>{DATA.metadata.sourceDifferencesAR}</Text><Text>لم يتم تعديل الدروس أو إعادة إنتاج الفيديوهات أو الصور في هذه المهمة.</Text><p dir="ltr" style={{textAlign:"left",fontSize:12,color:theme.text.tertiary,overflowWrap:"anywhere"}}>Source SHA-256: {DATA.metadata.sourceSha256}<br/>Frozen content digest: {DATA.metadata.snapshotDigest}</p>
  </Stack>
 </div>;
}
'''

if __name__=='__main__':export()
