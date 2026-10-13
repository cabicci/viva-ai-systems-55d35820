import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',server:{fs:{allow:[resolve(__dirname,'../..')]}},build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{pilot:resolve(__dirname,'index.html'),curriculum:resolve(__dirname,'curriculum.html')}}}});
