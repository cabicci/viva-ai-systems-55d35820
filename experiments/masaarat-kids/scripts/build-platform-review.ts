import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const base=resolve(import.meta.dir,'..'),repo=resolve(base,'../..');
// Optional dependency location lets the isolated Dell worktree reuse installed packages.
const dependencies=process.env.MASAARAT_REVIEW_DEPS||repo;
const dep=(name:string)=>Bun.resolveSync(name,dependencies);
const offline=resolve(base,'src/offline-review-services.ts');
const result=await Bun.build({entrypoints:[resolve(base,'src/review.tsx')],target:'browser',format:'iife',minify:true,plugins:[{name:'offline-review-only',setup(build){build.onResolve({filter:/^[^./]/},args=>{
 if(args.path==='@/lib/locale/locale-context')return {path:resolve(base,'src/review-locale.tsx')};
 if(['@/lib/auth-context','@/lib/quiz-attempt.functions','@/lib/learner-events','@tanstack/react-start'].includes(args.path))return {path:offline};
 if(args.path.startsWith('@/'))return {path:Bun.resolveSync(resolve(repo,'src',args.path.slice(2)),repo)};
 return {path:dep(args.path)};
});}}]});
if(!result.success)throw new Error(result.logs.join('\n'));
const {compile}=await import(pathToFileURL(dep('@tailwindcss/node')).href);
const {Scanner}=await import(pathToFileURL(dep('@tailwindcss/oxide')).href);
const source=(await readFile(resolve(repo,'src/styles.css'),'utf8')).replace('@source "../src";','');
const compiler=await compile(source,{base:dependencies,onDependency:()=>{}});
const scanner=new Scanner({sources:[{base:repo,pattern:'src/**/*.tsx',negated:false},{base,pattern:'src/review.tsx',negated:false}]});
const css=compiler.build(scanner.scan())+`\n@font-face{font-family:Cairo;src:url(data:font/ttf;base64,${(await readFile(resolve(base,'public/fonts/Cairo.ttf'))).toString('base64')})}html{scroll-padding-top:24px}button,select,textarea{font:inherit}button,summary{cursor:pointer}button:disabled{opacity:.45;cursor:default}.review-topbar{padding:10px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px}.review-select{border:1px solid var(--border);border-radius:12px;padding:8px 12px;background:var(--card);font-size:12px;max-width:320px}.review-button{border:1px solid var(--primary);color:var(--primary);border-radius:12px;padding:10px 16px;font-size:13px;min-height:44px}.review-input{display:block;width:100%;border:1px solid var(--border);border-radius:12px;padding:12px;margin-top:8px;min-height:110px;background:var(--card);resize:vertical}.text-emerald-200,.text-emerald-300{color:var(--accent-success-foreground)}.text-red-200,.text-red-300{color:var(--accent-danger-foreground)}.text-accent{color:var(--accent-foreground)}p{overflow-wrap:anywhere}summary{min-height:40px}button:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid var(--primary);outline-offset:3px}@media(max-width:640px){.review-topbar{padding:12px 16px;align-items:flex-start;flex-direction:column}.review-select{max-width:100%;width:100%}.review-topbar>div{width:100%}}`;
const course=JSON.parse(await readFile(resolve(base,'editorial-review/content.json'),'utf8'));
const images:any={};for(const l of ['ar-EG','ar-MSA','ar-Gulf','en'])images[l]='data:image/png;base64,'+(await readFile(resolve(base,`public/generated/illustrations/${l}.png`))).toString('base64');
const media=JSON.parse(await readFile(resolve(base,'content/media.json'),'utf8'));
const logo='data:image/png;base64,'+(await readFile(resolve(base,'public/brand/logo.png'))).toString('base64');
const js=await result.outputs[0].text();
for(const localMedia of [true,false]){
 const data=JSON.stringify({course,images,media,logo,localMedia}).replaceAll('<','\\u003c');
 const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Masaarat Kids</title><style>${css}</style></head><body><div id="root"></div><script type="application/json" id="data">${data}</script><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
 await writeFile(resolve(base,'editorial-review',localMedia?'index.html':'portable.html'),html);
}
await cp(resolve(base,'public/generated/videos'),resolve(base,'editorial-review/generated/videos'),{recursive:true});
console.log('Built learner review using platform IntroSection, QuizBlock and styles.css');