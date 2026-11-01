// @vitest-environment node
import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,appendFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES,HIST_MIGRATION_NAME,prepareDisposableSupabaseTree} from '../../../scripts/billing/prepare-disposable-supabase-tree';
const repo=fileURLToPath(new URL('../../../',import.meta.url));
function fixture(){
 const root=mkdtempSync(path.join(tmpdir(),'masaarat-original-disposable-'));
 const source=path.join(root,'fixture-repo'),dest=path.join(root,'disposable'),migrations=path.join(source,'supabase/migrations');
 // The adapter clears dest recursively: verify its resolved scope before invoking it.
 expect(path.dirname(path.resolve(dest))).toBe(path.resolve(root));expect(root.startsWith(path.resolve(tmpdir())+path.sep)).toBe(true);
 mkdirSync(migrations,{recursive:true});writeFileSync(path.join(source,'supabase/config.toml'),'project_id="isolated-fixture"\n');
 for(const name of [HIST_MIGRATION_NAME,...Object.keys(ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES)])copyFileSync(path.join(repo,'supabase/migrations',name),path.join(migrations,name));
 return{root,source,dest,migrations};
}
it('adapts only exact original operational patches in the disposable copy while preserving all source/privacy bytes',()=>{
 const f=fixture();const unrelated='20990101000000_unrelated_privacy_contract.sql',similar='20990101000001_original_assistant_source_events_extra.sql';
 const privacy=Buffer.from('-- exact privacy fixture\nCREATE TABLE privacy_fixture(id uuid PRIMARY KEY);\n');
 writeFileSync(path.join(f.migrations,unrelated),privacy);writeFileSync(path.join(f.migrations,similar),privacy);
 const originals=new Map([HIST_MIGRATION_NAME,...Object.keys(ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES),unrelated,similar].map(name=>[name,readFileSync(path.join(f.migrations,name))]));
 const result=prepareDisposableSupabaseTree({repoRoot:f.source,destRoot:f.dest});
 expect(result.adaptedOriginalAssistantPatches).toEqual(Object.entries(ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES).map(([name,sha256])=>({name,sha256})));
 for(const [name,sha256] of Object.entries(ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES)){
  const notice=readFileSync(path.join(f.dest,'supabase/migrations',name),'utf8');expect(notice).toContain('DISPOSABLE DELETION/PRIVACY VALIDATION ONLY');expect(notice).toContain(sha256);expect(notice).not.toContain('CREATE TABLE public.');
 }
 for(const name of [unrelated,similar])expect(readFileSync(path.join(f.dest,'supabase/migrations',name))).toEqual(privacy);
 for(const [name,bytes] of originals)expect(readFileSync(path.join(f.migrations,name))).toEqual(bytes);
 expect(result.adaptedHistorical).toBe(true);expect(result.migrationsCopied).toBe(originals.size);
});
it.each(Object.keys(ORIGINAL_ASSISTANT_OPERATIONAL_PATCHES))('refuses drift in %s before clearing the disposable destination',name=>{
 const f=fixture();mkdirSync(f.dest);const sentinel=path.join(f.dest,'existing-fixture.txt');writeFileSync(sentinel,'preserve this');
 appendFileSync(path.join(f.migrations,name),'\n-- unreviewed drift\n');
 expect(()=>prepareDisposableSupabaseTree({repoRoot:f.source,destRoot:f.dest})).toThrow('operational patch changed');
 expect(readFileSync(sentinel,'utf8')).toBe('preserve this');expect(existsSync(path.join(f.dest,'supabase/migrations'))).toBe(false);
});
