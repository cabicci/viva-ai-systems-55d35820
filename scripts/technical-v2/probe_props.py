import importlib.util,json
from pathlib import Path
s=importlib.util.spec_from_file_location('production',Path(__file__).with_name('production.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
for lesson,locale in [('M01-L01','en'),('M05-L02','ar-EG'),('M05-L03','ar-EG'),('M04-L02','en')]:
 title,scenes=m.scenes_for(lesson,locale)
 path=m.ROOT/'technical-v2-probes'/f'{lesson}__{locale}'/'motion-props.json';path.parent.mkdir(parents=True,exist_ok=True)
 m.dump(path,{'lessonId':lesson,'locale':locale,'title':title,'scenes':scenes,'sceneFrames':[300]*len(scenes)})
print('Four representative motion props prepared; no TTS.')
