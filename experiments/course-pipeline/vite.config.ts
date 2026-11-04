import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',server:{fs:{allow:[resolve(__dirname,'../..')]},watch:{ignored:['**/production/private/**','**/production/packages/**','**/production/output/**','**/production/arabic-review/**','**/public/curriculum/media/**','**/dist/**']}},build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{pilot:resolve(__dirname,'index.html'),curriculum:resolve(__dirname,'curriculum.html')}}}});
