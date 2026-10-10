import importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
s=importlib.util.spec_from_file_location('production',Path(__file__).with_name('production.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ReplacementGuards(unittest.TestCase):
 def scenario(self,fail=None):
  calls=[];old='11111111-1111-4111-8111-111111111111';new='22222222-2222-4222-8222-222222222222'
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);w=root/'technical-v2-output/M01-L01__ar-EG';w.mkdir(parents=True)
   (w/'replacement.mp4').write_bytes(b'new');(w/'previous.mp4').write_bytes(b'old')
   r={'oldGuid':old,'newGuid':new,'videoSha256':m.digest(w/'replacement.mp4'),'backupSha256':m.digest(w/'previous.mp4')}
   m.dump(w/'receipt.json',r)
   def bunny(method,path,body=None):
    calls.append((method,path))
    if path.startswith('?'):return {'items':[{'guid':new,'status':4,'title':f'{m.BATCH}:M01-L01__ar-EG'}]}
    if method=='GET':return {'guid':old,'collectionId':'unrelated' if fail=='identity' else '4972720c-4dd7-48e6-b341-34e3b4875b26'}
    return {}
   bridges=[]
   def bridge(body):
    bridges.append(1)
    if fail=='link' or fail=='confirm' and len(bridges)==2:raise RuntimeError('Mapping unavailable')
    return {'linked':True,'newGuid':new,'oldGuid':old}
   with patch.object(m,'ROOT',root),patch.object(m,'bunny',side_effect=bunny),patch.object(m,'bridge',side_effect=bridge),patch.dict(m.os.environ,{'BACKUP_ARTIFACT_ID':'' if fail=='backup' else '456'}):
    if fail:
     with self.assertRaises(RuntimeError):m.publish('M01-L01','ar-EG')
    else:m.publish('M01-L01','ar-EG')
   return calls,bridges,json.loads((w/'receipt.json').read_text())
 def test_failure_never_deletes(self):
  for failure in ('backup','link','confirm','identity'):
   calls,_,_=self.scenario(failure);self.assertFalse(any(c[0]=='DELETE' for c in calls),failure)
 def test_only_confirmed_old_cell_deleted(self):
  calls,bridges,r=self.scenario();self.assertEqual(len(bridges),2)
  self.assertEqual([c for c in calls if c[0]=='DELETE'],[('DELETE','/11111111-1111-4111-8111-111111111111')])
  self.assertEqual(r['status'],'linked-old-deleted');self.assertFalse(r['oldVideoRetained'])
if __name__=='__main__':unittest.main()
