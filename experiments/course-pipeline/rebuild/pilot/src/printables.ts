import regular from '../../../../../src/lib/lesson-visuals/v1/fonts/Tajawal-Regular.ttf?inline';
import bold from '../../../../../src/lib/lesson-visuals/v1/fonts/Tajawal-Bold.ttf?inline';
import logo from '../../../../../public/brand/masaarat-logo-lockup.png?inline';
import license from './Tajawal-OFL.txt?raw';
import {escapeHtml as esc} from './logic.mjs';

/** A self-contained worksheet: fonts and branding remain available offline. */
export function worksheetHtml(p:any,title:string,rows:string[],intro:string){
 return `<!doctype html><html lang="${p.locale}" dir="${p.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
@font-face{font-family:Tajawal;src:url('${regular}') format('truetype');font-weight:400}
@font-face{font-family:Tajawal;src:url('${bold}') format('truetype');font-weight:700}
*{box-sizing:border-box}body{font-family:Tajawal,Arial,sans-serif;font-size:17px;line-height:1.8;max-width:800px;margin:32px auto;padding:24px;color:oklch(0.30 0.04 260);background:white}header{border-bottom:2px solid oklch(0.62 0.08 235);padding-bottom:18px;margin-bottom:24px}header img{width:160px;height:64px;object-fit:contain;display:block;margin-bottom:14px}h1{font-size:28px;line-height:1.5;margin:10px 0}h2{font-size:23px;color:oklch(0.62 0.08 235)}ol{padding-inline-start:26px}li{padding-inline-start:6px;margin:22px 0;break-inside:avoid;page-break-inside:avoid}.blank{height:82px;border-bottom:1px solid #bac7cb}small{color:oklch(0.50 0.03 250)}footer{font-size:14px;border-top:1px solid #bac7cb;padding-top:16px;margin-top:26px}@page{size:A4;margin:18mm}@media print{body{margin:0;padding:0;max-width:none}h1,h2{break-after:avoid}header{break-inside:avoid}}@media(max-width:600px){body{margin:0;padding:20px}}
</style></head><body><header><img src="${logo}" alt="Masaarat"><small>${esc(p.path)} · ${esc(p.step)}</small><h1>${esc(p.title)}</h1></header><main><h2>${esc(title)}</h2><p>${esc(intro)}</p><ol>${rows.map(x=>`<li>${esc(x)}<div class="blank"></div></li>`).join('')}</ol></main><footer>${esc(p.ui.unobserved)}</footer><script type="text/plain" id="font-license">${license.replace(/<\//g,'<\\/')}</script></body></html>`;
}
