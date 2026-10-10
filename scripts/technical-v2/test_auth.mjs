import assert from 'node:assert/strict';
import {enforceClaims,AUDIENCE,REPOSITORY,BRANCH,WORKFLOW} from '../../supabase/functions/technical-video-replacement/auth.ts';
const now=1000000,sha='a'.repeat(40);
const good={iss:'https://token.actions.githubusercontent.com',aud:AUDIENCE,repository:REPOSITORY,repository_id:'1272666418',repository_owner_id:'236468702',ref:BRANCH,workflow_ref:WORKFLOW,sha,workflow_sha:sha,event_name:'push',actor_id:'236468702',runner_environment:'github-hosted',iat:now-10,nbf:now-10,exp:now+100,run_id:'123'};
assert.doesNotThrow(()=>enforceClaims(good,sha,now));
for(const[key,value]of Object.entries({iss:'evil',aud:'evil',repository:'evil/repo',repository_id:'1',repository_owner_id:'1',ref:'refs/heads/main',workflow_ref:'other',sha:'b'.repeat(40),workflow_sha:'b'.repeat(40),event_name:'pull_request',actor_id:'1',runner_environment:'self-hosted',iat:now-700,nbf:now+30,exp:now,run_id:'bad'})){
 assert.throws(()=>enforceClaims({...good,[key]:value},sha,now),key);
}
console.log('OIDC trust checks: valid workflow accepted; 16 unauthorized variants rejected.');
