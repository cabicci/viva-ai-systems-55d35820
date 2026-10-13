import React from 'react';
import {AbsoluteFill,Composition,Img,Sequence,interpolate,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import {Diagram} from '../../../experiments/course-pipeline/src/Diagram';
import {Annotations} from '../../../experiments/course-pipeline/src/Annotations';

type Scene={id:string;title:string;lead:string;labels:string[];startFrame:number;durationInFrames:number};
type Props={locale:string;dir:string;title:string;eyebrow:string;scenes:Scene[];durationInFrames:number;visuals:Record<string,string>};
const font='Cairo, sans-serif';
function SceneView({scene,locale,dir,index,total,visual}: {scene:Scene;locale:string;dir:string;index:number;total:number;visual?:string}){
 const frame=useCurrentFrame();
 const fade=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
 const progress=interpolate(frame,[10,Math.max(160,scene.durationInFrames*.75)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 if(visual)return <AbsoluteFill style={{background:'#f4f1e9',fontFamily:font,color:'#263f36',direction:dir as 'rtl'|'ltr'}}>
  <style>{`@font-face{font-family:Cairo;src:url('${staticFile('course-pipeline/Cairo.ttf')}') format('truetype');font-weight:200 1000;font-display:block}`}</style>
  <div style={{position:'absolute',top:45,left:80,right:80,display:'flex',alignItems:'center',justifyContent:'space-between'}}><img src={staticFile('course-pipeline/logo.png')} style={{width:190,height:74,objectFit:'contain'}}/><span style={{fontSize:26,direction:'ltr'}}>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span></div>
  <h1 style={{position:'absolute',zIndex:2,top:125,left:110,right:110,fontSize:60,lineHeight:1.3,fontWeight:800,margin:0,textAlign:'center'}}>{scene.title}</h1>
  <div style={{position:'absolute',top:210,left:320,width:1280,height:720,overflow:'hidden',borderRadius:35,opacity:fade,transform:`scale(${1+progress*.025})`}}><Img src={staticFile(visual)} style={{width:'100%',height:'100%',objectFit:'contain'}}/><Annotations kind={scene.id} progress={progress} locale={locale}/></div>
  <div style={{position:'absolute',left:120,right:120,bottom:100,display:'flex',gap:26,justifyContent:'center',zIndex:3}}>{scene.labels.map((label,i)=><div key={i} style={{maxWidth:510,flex:1,padding:'20px 24px',borderRadius:16,fontSize:29,lineHeight:1.5,fontWeight:700,textAlign:'center',background:'#fffdf3ed',boxShadow:'0 8px 24px #453f2720',border:'1px solid #d6d9c9',opacity:interpolate(progress,[i*.2,i*.2+.15],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),transform:`translateY(${interpolate(progress,[i*.2,i*.2+.15],[16,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px)`}}>{label}</div>)}</div>
  <div style={{position:'absolute',left:100,right:100,bottom:44,height:6,background:'#d4dfd2',borderRadius:10}}><div style={{height:6,width:`${Math.min(100,100*frame/scene.durationInFrames)}%`,background:'#528566',borderRadius:10}}/></div>
 </AbsoluteFill>;
 return <AbsoluteFill style={{background:'linear-gradient(135deg,#f4f5e9,#e1eee5 60%,#e9e5f0)',fontFamily:font,color:'#263f36',padding:'72px 100px',direction:dir as 'rtl'|'ltr'}}>
  <style>{`@font-face{font-family:Cairo;src:url('${staticFile('course-pipeline/Cairo.ttf')}') format('truetype');font-weight:200 1000;font-display:block}`}</style>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:85}}><img src={staticFile('course-pipeline/logo.png')} style={{maxWidth:230,maxHeight:85,objectFit:'contain'}}/><span style={{fontSize:28,fontWeight:700,direction:'ltr'}}>{String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span></div>
  <div style={{display:'flex',gap:70,alignItems:'center',flex:1,opacity:fade}}>
   <div style={{width:670,flexShrink:0}}><div style={{width:75,height:8,background:'#528566',borderRadius:8,marginBottom:30}}/><h1 style={{fontSize:64,lineHeight:1.35,margin:'0 0 34px',fontWeight:800}}>{scene.title}</h1><p style={{fontSize:35,lineHeight:1.8,margin:0}}>{scene.lead}</p></div>
   <div style={{flex:1,minWidth:0}}>{visual?<div><div style={{borderRadius:30,overflow:'hidden',boxShadow:'0 16px 40px #263f3612'}}><Img src={staticFile(visual)} style={{width:'100%',display:'block',transform:`scale(${1+progress*.035})`}}/></div><div style={{display:'flex',gap:20,justifyContent:'space-around',fontSize:26,fontWeight:700,textAlign:'center',paddingTop:30}}>{scene.labels.map((label,i)=><div key={i} style={{flex:1,opacity:interpolate(progress,[i*.2,i*.2+.16],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>{label}</div>)}</div></div>:<Diagram kind={scene.id} labels={scene.labels} progress={progress} locale={locale}/>}</div>
  </div>
  <div style={{height:6,background:'#d4dfd2',borderRadius:10}}><div style={{height:6,width:`${Math.min(100,100*frame/scene.durationInFrames)}%`,background:'#528566',borderRadius:10}}/></div>
 </AbsoluteFill>;
}
function Lesson(props:Props){return <AbsoluteFill>{props.scenes.map((scene,i)=><Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}><SceneView scene={scene} locale={props.locale} dir={props.dir} index={i} total={props.scenes.length} visual={props.visuals?.[scene.id]}/></Sequence>)}</AbsoluteFill>}
const defaults:Props={locale:'en',dir:'ltr',title:'Soil sampling',eyebrow:'MASAARAT',scenes:[],durationInFrames:30,visuals:{}};
registerRoot(()=> <Composition id="CoursePilot" component={Lesson} width={1920} height={1080} fps={30} durationInFrames={30} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationInFrames})}/>);
