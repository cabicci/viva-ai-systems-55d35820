import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { FloatingAssistantLauncher } from "../../src/components/learn/FloatingAssistantLauncher";
import "../../src/styles.css";
function Proof() {
  const [scope,setScope]=useState("lesson-A"),[sent,setSent]=useState(false);
  return <main style={{padding:24,minHeight:"100vh"}}>
    <h1>فحص محلي لزر مساعد الدرس</h1>
    <p>الزر والتنسيق حقيقيان؛ محتوى الدرس والجواب هنا عناصر فحص واجهة فقط.</p>
    <button id="switch" onClick={()=>{setScope(x=>x==="lesson-A"?"lesson-B":"lesson-A");setSent(false);}}>تغيير سياق الفحص</button>
    <FloatingAssistantLauncher key={scope} fabLabel="المساعد" fabAriaLabel="افتح مساعد الدرس" panelTitle="مساعد الدرس">
      <p id="scope">{scope}</p><label htmlFor="question">سؤالك</label>
      <textarea id="question" style={{width:"100%",height:100,border:"1px solid"}}/>
      <button id="send" onClick={()=>setSent(true)}>إرسال</button>
      {sent?<p role="status">تعذّر الاتصال في فحص الواجهة؛ لم يُستدعَ أي نموذج.</p>:null}
    </FloatingAssistantLauncher>
    <button id="continue" data-assistant-avoid style={{position:"fixed",left:16,bottom:16,width:220,height:56,background:"#bcdfee",borderRadius:16}}>متابعة الدرس</button>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Proof/>);
