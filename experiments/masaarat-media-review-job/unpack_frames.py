import hashlib,json,zipfile,shutil
from pathlib import Path
target=Path('frames');target.mkdir(exist_ok=True)
receipt=json.loads(Path('input-frames/receipt.json').read_text())
expected={r['file']:r['sha256'] for r in receipt['frames']}
assert len(expected)==697 and set(expected)=={f'frame-{i:04d}.png' for i in range(697)}
seen=set()
for archive in sorted(Path('input-frames').glob('part-*.zip')):
 with zipfile.ZipFile(archive) as z:
  for name in z.namelist():
   assert name in expected and name not in seen, name
   data=z.read(name);assert hashlib.sha256(data).hexdigest()==expected[name],name
   (target/name).write_bytes(data);seen.add(name)
assert seen==set(expected)
Path('output').mkdir(exist_ok=True)
shutil.copyfile('input-frames/receipt.json','output/frame-receipts.json')
print('All 697 exact captured frame hashes verified')
