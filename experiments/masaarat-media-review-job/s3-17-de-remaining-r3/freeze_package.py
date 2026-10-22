from pathlib import Path
import json,hashlib
HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files=['worker.py', 'request.json', 'runtime.json', 'narration-de.json', 'inputs/source-de.json', 'scientific-contract.json', 'implementation-dependency-pins.json', 'subset-provenance.json', 'content-identities.json', 'source-coverage.json', 'README.en.md', 'trigger-policy.json', 'remote-branch-check.json', '.gitignore', 'vendor/pipeline-engine.py', 'vendor/course/manifest.json', 'freeze_package.py', 'offline_tests.py', 'worker-derivation.json', 'workflow.template.yml']
freeze={'schemaVersion':2,'stepId':'S3-17','sha256':{rel:sha(HERE/rel)for rel in files},'maximumTTSCalls':7,'maximumBlindAudioReviewCalls':7,'maximumASRInvocations':7,'maximumMetadataGETs':2,'maximumPerPartPerKind':1,'automaticRetries':0,'all7SelectedPartsRequired':True}
(HERE/'freeze.json').write_text(json.dumps(freeze,indent=2)+'\n','utf-8')
text=(HERE/'workflow.template.yml').read_text('utf-8').replace('REQUEST_PIN',sha(HERE/'request.json')).replace('WORKER_PIN',sha(HERE/'worker.py')).replace('FREEZE_PIN',sha(HERE/'freeze.json'))
workflow=HERE/'s3-17-de-remaining-r3.yml';workflow.write_text(text,'utf-8')
receipt={'schema':'masaarat.S3-17.seven-only-tts-first.r3','requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'freezeSha256':sha(HERE/'freeze.json'),'workflowSha256':sha(workflow),'frozenFileCount':len(files),'all7TtsAndImmediateUploadsBeforeDiagnostics':True,'isolatedPerUnitDiagnostics':True,'finalMissingDiagnosticsInventoryRequired':True,'providerCallsPerformed':0,'publicationPerformed':False}
(HERE/'package-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n','utf-8')
print(json.dumps(receipt))
