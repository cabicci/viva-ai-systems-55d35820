import React from 'react';
import {AbsoluteFill,Composition,Sequence,interpolate,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import {Diagram} from '../../../experiments/course-pipeline/src/Diagram';

type Scene={id:string;title:string;lead:string;labels:string[];startFrame:number;durationInFrames:number};
type Props={locale:string;dir:string;title:string;eyebrow:string;scenes:Scene[];durationInFrames:number};
const font='Cairo, sans-serif';
function SceneView({scene,locale,dir,index,total}: {scene:Scene;locale:string;dir:string;index:number;total:number}){
 const frame=useCurrentFrame();
 const fade=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
 const progress=interpolate(frame,[10,145],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:'linear-gradient(135deg,#f4f5e9,#e1eee5 60%,#e9e5f0)',fontFamily:font,color:'#263f36',padding:'72px 100px',direction:dir as 'rtl'|'ltr'}}>
  <style>{`@font-face{font-family:Cairo;src:url('${staticFile('course-pipeline/Cairo.ttf')}') format('truetype');font-weight:200 1000;font-display:block}`}</style>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:85}}><img src={staticFile('course-pipeline/logo.png')} style={{maxWidth:230,maxHeight:85,objectFit:'contain'}}/><span style={{fontSize:28,fontWeight:700}}>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span></div>
  <div style={{display:'flex',gap:70,alignItems:'center',flex:1,opacity:fade}}>
   <div style={{width:670,flexShrink:0}}><div style={{width:75,height:8,background:'#528566',borderRadius:8,marginBottom:30}}/><h1 style={{fontSize:64,lineHeight:1.35,margin:'0 0 34px',fontWeight:800}}>{scene.title}</h1><p style={{fontSize:35,lineHeight:1.8,margin:0}}>{scene.lead}</p></div>
   <div style={{flex:1,minWidth:0}}><Diagram kind={scene.id} labels={scene.labels} progress={progress} locale={locale}/></div>
  </div>
  <div style={{height:6,background:'#d4dfd2',borderRadius:10}}><div style={{height:6,width:`${Math.min(100,100*frame/scene.durationInFrames)}%`,background:'#528566',borderRadius:10}}/></div>
 </AbsoluteFill>;
}
function Lesson(props:Props){return <AbsoluteFill>{props.scenes.map((scene,i)=><Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}><SceneView scene={scene} locale={props.locale} dir={props.dir} index={i} total={props.scenes.length}/></Sequence>)}</AbsoluteFill>}
const defaults:Props={locale:'en',dir:'ltr',title:'Soil sampling',eyebrow:'MASAARAT',scenes:[],durationInFrames:30};
registerRoot(()=> <Composition id="CoursePilot" component={Lesson} width={1920} height={1080} fps={30} durationInFrames={30} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationInFrames})}/>);
