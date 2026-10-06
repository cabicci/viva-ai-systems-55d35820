import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';

type Scene = {id:string; blockId:string; title:string; kind:string; display:string; spoken:string;
  cells?: {label:string; value:string}[]; rowIndex?:number; rowCount?:number};
type Props = {locale:string; lessonId:string; title:string; scenes:Scene[]; sceneFrames:number[];
  chapters:{id:string; title:string}[]};

// Video-only composition. Reading HTML/tables/diagrams and images are not imported.
function CourseVideo({locale, lessonId, title, scenes, sceneFrames, chapters}:Props) {
  const frame=useCurrentFrame();
  let index=0,start=0;
  while(index<sceneFrames.length-1 && frame>=start+sceneFrames[index]) start+=sceneFrames[index++];
  const scene=scenes[index], local=frame-start, en=locale==='en';
  const total=sceneFrames.reduce((a,b)=>a+b,0);
  const palette=['#357a84','#845c7d','#7b7938','#315f94'];
  const accent=palette[index%palette.length];
  const graphic=!!scene.cells;
  const textSize=scene.display.length>350?34:scene.display.length>230?38:44;
  const enter=interpolate(local,[0,18],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill dir={en?'ltr':'rtl'} style={{background:'linear-gradient(135deg,#edf6ff,#e4f2eb 58%,#f4e9ef)',color:'#203f45',fontFamily:'Tajawal,Arial,sans-serif'}}>
    <style>{`@font-face{font-family:Tajawal;src:url(${staticFile('academic-fonts/Tajawal-Regular.woff2')});font-weight:400}@font-face{font-family:Tajawal;src:url(${staticFile('academic-fonts/Tajawal-Bold.woff2')});font-weight:700}`}</style>
    <header style={{position:'absolute',top:48,left:80,right:80,display:'flex',alignItems:'center',justifyContent:'space-between',gap:45}}>
      <Img src={staticFile('brand/masaarat-logo-lockup.png')} style={{width:250,height:72,objectFit:'contain'}}/>
      <div style={{textAlign:'end',maxWidth:1350}}><div style={{fontSize:24,color:'#48787b'}}>{en?'Masaarat Academic':'مسارات أكاديمي'} · <bdi>{lessonId}</bdi></div><div style={{fontSize:32,lineHeight:1.5}}>{title}</div></div>
    </header>
    <section style={{position:'absolute',top:182,left:80,right:80,height:754,opacity:enter,transform:`translateY(${(1-enter)*18}px)`}}>
      <h1 style={{fontSize:scene.title.length>80?38:46,lineHeight:1.5,margin:'0 0 30px',maxWidth:1750}}>{scene.title}</h1>
      {graphic ? <>
        <div style={{display:'flex',gap:26,alignItems:'stretch',marginTop:36}}>
          {scene.cells!.map((cell,i)=><div key={i} style={{flex:1,minWidth:0,borderRadius:36,background:i===Math.min(scene.cells!.length-1,Math.floor(local/Math.max(1,sceneFrames[index]/scene.cells!.length)))?'#fff':'#ffffffad',border:`3px solid ${accent}55`,padding:'32px 30px',minHeight:360,boxShadow:'0 16px 36px #203f4512',transform:`translateY(${Math.sin(Math.min(1,local/30)*Math.PI)*-8}px)`}}>
            <div style={{width:68,height:68,borderRadius:'50%',background:accent,color:'#fff',display:'grid',placeItems:'center',fontSize:34,marginBottom:26}}>{i+1}</div>
            <div style={{fontSize:30,color:accent,fontWeight:700,marginBottom:20}}>{cell.label}</div>
            <div style={{fontSize:cell.value.length>150?28:cell.value.length>90?32:38,lineHeight:1.6,overflowWrap:'anywhere',unicodeBidi:'plaintext'}}>{cell.value}</div>
          </div>)}
        </div>
        <div style={{display:'flex',gap:10,marginTop:26}}>{Array.from({length:scene.rowCount||1},(_,i)=><div key={i} style={{height:9,flex:1,borderRadius:8,background:i===(scene.rowIndex||0)?accent:'#bfcfd0'}}/>)}</div>
        <p style={{fontSize:28,lineHeight:1.6,margin:'24px 0 0',maxWidth:1720}}>{scene.display}</p>
      </> : <div style={{display:'flex',gap:45,alignItems:'stretch'}}>
        <div style={{flex:1.6,borderRadius:36,background:'#ffffffdd',borderInlineStart:`9px solid ${accent}`,padding:42,minHeight:515,fontSize:textSize,lineHeight:1.75,unicodeBidi:'plaintext'}}>{scene.display}</div>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:14}}>{chapters.map((chapter,i)=><div key={chapter.id} style={{display:'flex',alignItems:'center',gap:16,padding:'17px 20px',borderRadius:20,background:chapter.id===scene.blockId?accent:'#ffffffa8',color:chapter.id===scene.blockId?'#fff':'#36585e',fontSize:25,lineHeight:1.5}}><span style={{minWidth:34,fontWeight:700}}>{i+1}</span><span>{chapter.title}</span></div>)}</div>
      </div>}
    </section>
    <footer style={{position:'absolute',bottom:38,left:80,right:80,display:'flex',justifyContent:'space-between',fontSize:24,color:'#456b70'}}><span>{en?'Produced by Masaarat':'إنتاج مسارات'}</span><span>{index+1} / {scenes.length}</span></footer>
    <div style={{position:'absolute',bottom:0,left:0,height:10,width:`${100*frame/Math.max(1,total)}%`,background:accent}}/>
  </AbsoluteFill>;
}

const defaults:Props={locale:'en',lessonId:'AC-BUS',title:'Masaarat Academic',chapters:[],
  scenes:[{id:'review',blockId:'intro',title:'Review',kind:'opening',display:'Academic course',spoken:''}],sceneFrames:[120]};
registerRoot(()=> <Composition id="academic-course" component={CourseVideo} defaultProps={defaults}
  durationInFrames={120} fps={30} width={1920} height={1080}
  calculateMetadata={({props})=>({durationInFrames:props.sceneFrames.reduce((a,b)=>a+b,0)})}/>);
