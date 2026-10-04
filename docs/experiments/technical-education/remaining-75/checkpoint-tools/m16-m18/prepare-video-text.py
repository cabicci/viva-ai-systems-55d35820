import json,sys,re
from pathlib import Path
root=Path('.')
module=sys.argv[1]
for f in (root/'src/lib/technical-education/lessons').glob(module+'*.json'):
 pkg=json.loads(f.read_text());id=pkg['id'];locale=pkg['locale']
 script={'schema_version':1,'lesson_id':id,'locale':locale,'status':'contextual_text_draft_pending_pronunciation_and_listener_review','audio_generated':False,'video_generated':False,'scenes':[{'id':'intro','display_title':pkg['title'],'spoken_text':re.sub('[\u2066-\u2069]','',pkg['intro']),'caption':pkg['intro']},*({'id':s['id'],'display_title':s['title'],'spoken_text':re.sub('[\u2066-\u2069]','',s['text']),'caption':s['caption'],'diagram':s['diagram']} for s in pkg['sections']),{'id':'decision','display_title':pkg['example']['title'],'spoken_text':re.sub('[\u2066-\u2069]','',pkg['example']['text']+' '+pkg['example']['decision']),'caption':pkg['example']['decision']},{'id':'practice','display_title':pkg['assignment']['prompt'],'spoken_text':re.sub('[\u2066-\u2069]','',pkg['assignment']['prompt']),'caption':pkg['assignment']['prompt']}]}
 for scene in script['scenes']:scene['spoken_text']=scene['spoken_text'].replace('\u00a0',' ').replace('مجموعتا اجتماع (2)','مجموعتا اجتماع')
 out=root/f'docs/experiments/technical-education/remaining-75/video-scripts/{id}__{locale}.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(script,ensure_ascii=False,indent=2)+'\n')
