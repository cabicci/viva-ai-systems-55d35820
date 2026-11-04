"""Mux real UI capture and checked narration; no generated substitute screens."""
import argparse,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--locale',required=True,choices=['ar-EG','en','it','de']);ap.add_argument('--ffmpeg',default='ffmpeg');ap.add_argument('--ffprobe',default='ffprobe');a=ap.parse_args()
    folder=ROOT/'walkthrough-output'/a.locale
    receipt=json.loads((folder/'receipt.json').read_text(encoding='utf-8'));capture=json.loads((folder/'capture-receipt.json').read_text(encoding='utf-8'))
    assert capture['actualInterface'] and not capture['errors'] and len(capture['actions'])==10
    assert receipt['automatedAudioReview']['passed']
    assert hashlib.sha256((folder/'master.wav').read_bytes()).hexdigest()==receipt['automatedAudioReview']['audioHash']
    target=folder/'walkthrough.mp4'
    subprocess.run([a.ffmpeg,'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(folder/'capture/frames.ffconcat'),'-i',str(folder/'master.wav'),'-t',str(receipt['seconds']),'-vf','scale=1920:1080,fps=30','-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',str(target)],check=True)
    info=json.loads(subprocess.check_output([a.ffprobe,'-v','error','-show_streams','-show_format','-of','json',str(target)]))
    video=next(s for s in info['streams'] if s['codec_type']=='video');audio=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert video['codec_name']=='h264' and audio['codec_name']=='aac'
    assert (video['width'],video['height'])==(1920,1080)
    assert abs(float(info['format']['duration'])-receipt['seconds'])<.25
    receipt.update(videoGenerated=True,actualInterface=True,verified={'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'duration':float(info['format']['duration']),'video':'h264','audio':'aac','width':1920,'height':1080},ownerAccepted=False,published=False)
    (folder/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(str(target))
if __name__=='__main__':main()
