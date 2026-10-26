// Actions-only local verification/exposure of the exact lock-verified package.
// No download, apt, sudo, package scripts, credentials or remote API calls here.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{createRequire}=require('module'),{execFileSync}=require('child_process');
function argument(name){const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];}
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
function main(){
 if(process.env.GITHUB_ACTIONS!=='true'||process.platform!=='linux'||process.arch!=='x64')throw Error('Exact Linux x64 Actions job required; no local binary execution');
 const dep=path.resolve(argument('--dependency-root')||'.'),req=createRequire(path.join(dep,'package.json'));
 const pkgFile=req.resolve('@remotion/compositor-linux-x64-gnu/package.json'),dir=fs.realpathSync(path.dirname(pkgFile));
 const metadataFile=path.join(__dirname,'verified-package.en.json');
 if(sha(metadataFile)!=='82cd4e18ff20c964535bbf5ea61690da23753731fc6b208e10f790cf428d4dac')throw Error('Frozen companion metadata changed');
 const expected=JSON.parse(fs.readFileSync(metadataFile,'utf8'));
 const meta=JSON.parse(fs.readFileSync(pkgFile,'utf8'));
 if(meta.name!=='@remotion/compositor-linux-x64-gnu'||meta.version!=='4.0.466'||expected.version!=='4.0.466')throw Error('Unexpected companion name/version');
 const nodeModules=fs.realpathSync(path.join(dep,'node_modules'));
 if(!dir.startsWith(nodeModules+path.sep))throw Error('Package resolved outside the declared installed dependencies');
 const checked={};
 for(const [name,pin] of Object.entries(expected.files)){
  if(!name.startsWith('package/')||name.slice(8).includes('/'))throw Error('Unexpected archive-relative path');
  const file=path.join(dir,name.slice(8));
  if(sha(file)!==pin.sha256||fs.statSync(file).size!==pin.bytes)throw Error('Installed companion file differs: '+name);
  checked[name.slice(8)]=pin.sha256;
 }
 const temp=fs.realpathSync(process.env.RUNNER_TEMP),bin=fs.mkdtempSync(path.join(temp,'masaarat-media-bin-'));
 const versions={};
 for(const name of ['ffmpeg','ffprobe']){
  const file=path.join(dir,name);fs.accessSync(file,fs.constants.X_OK);
  // Keep adjacent pinned libav*.so files in their installed package directory.
  fs.symlinkSync(file,path.join(bin,name),'file');
  versions[name]=execFileSync(path.join(bin,name),['-hide_banner','-version'],{encoding:'utf8',timeout:10000,killSignal:'SIGKILL',stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024}).split('\n')[0];
 }
 if(!process.env.GITHUB_PATH||!process.env.GITHUB_ENV)throw Error('Actions PATH/environment files unavailable');
 fs.appendFileSync(process.env.GITHUB_PATH,bin+'\n');
 fs.appendFileSync(process.env.GITHUB_ENV,'MASAARAT_FFMPEG_ABSOLUTE='+path.join(bin,'ffmpeg')+'\nMASAARAT_FFPROBE_ABSOLUTE='+path.join(bin,'ffprobe')+'\n');
 const receipt={state:'EXACT_COMPANION_VERIFIED_JOB_PATH_READY',package:meta.name,version:meta.version,archiveSHA512_SRI:expected.archiveSHA512_SRI,installedDirectory:dir,jobBin:bin,files:checked,versions,versionTimeoutMilliseconds:10000,aptCalls:0,downloadsByBootstrap:0,providerCalls:0};
 const out=path.resolve(argument('--receipt')||'media-bootstrap-receipt.en.json');if(fs.existsSync(out))throw Error('Receipt already exists; never overwrite another operation');
 fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}
main();
