"""Extract real rendered scene frames, grouped for review. No provider calls."""
import argparse,hashlib,json,os,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'private/qa-deps'))
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--ffmpeg',default='ffmpeg');ap.add_argument('--lesson');a=ap.parse_args()
    out=ROOT.parent/'review-evidence/full-course';out.mkdir(parents=True,exist_ok=True)
    done=[]
    for pkg in sorted((ROOT/'packages').glob(a.lesson or 'SOIL-*')):
        for locale in ['ar-EG','en','it','de']:
            folder=pkg/'output'/locale
            if not (folder/'lesson.mp4').exists() or not (folder/'props.json').exists():continue
            video=folder/'lesson.mp4';digest=hashlib.sha256(video.read_bytes()).hexdigest()
            dest=out/(pkg.name+'-'+locale);dest.mkdir(exist_ok=True)
            marker=dest/'video.sha256'
            sheet=dest/'contact.png'
            if marker.exists() and marker.read_text()==digest and sheet.exists():continue
            props=json.loads((folder/'props.json').read_text(encoding='utf-8'))
            for i,scene in enumerate(props['scenes'],1):
                seconds=(scene['startFrame']+scene['durationInFrames']*.8)/30
                subprocess.run([a.ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',str(seconds),'-i',str(video),'-frames:v','1','-vf','scale=480:270',str(dest/('frame-%02d.png'%i))],check=True)
            rows=(len(props['scenes'])+1)//2
            from PIL import Image
            with Image.new('RGB',(960,270*rows),'white') as canvas:
                for i in range(len(props['scenes'])):
                    with Image.open(dest/('frame-%02d.png'%(i+1))) as frame:canvas.paste(frame,(480*(i%2),270*(i//2)))
                canvas.save(sheet)
            marker.write_text(digest)
            done.append({'lesson':pkg.name,'locale':locale,'sheet':str(sheet)})
    print(json.dumps(done))
if __name__=='__main__':main()
