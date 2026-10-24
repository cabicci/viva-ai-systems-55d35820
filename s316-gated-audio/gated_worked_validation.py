"""OFFLINE PROPOSAL ONLY. Does not call provider, change a worker or authorize publication."""
import hashlib,json
LOCALES=('ar-EG','en','it','de')
EXPECTED_GATE={'id': 'AFTER_CORRESPONDING_OWN_CASE_EXPLANATION', 'ownCaseOnly': True, 'requiresNonblankReportAttempt': True, 'textPresenceIsNotSemanticGrading': True, 'editReloadResetRehide': True, 'mayNotEnterOrdinaryLinearVideo': True}
def validate_gated_worked_unit(u,source,source_sha):
 assert u['model']=='gemini-3.8-flash-tts'
 assert u['sourceWholeFileSHA256']==source_sha
 assert u['locale']in LOCALES
 assert u['assessmentSolutionsIncluded']is True
 assert u['liveQuizAnswerKeyIncluded']is False
 written=False
 assert u['sourceWrittenCaseModelAnswerIncluded']is written and u['quizOrWrittenKeysIncluded']is written
 assert u['workedExampleFullModelAnswer']is True
 assert u['disclosureGate']==EXPECTED_GATE
 assert u['semanticGroup']in ('E01', 'E02', 'E03', 'E04')
 i=int(u['semanticGroup'][1:])-1
 assert u['id']==u['unitId']==f"S3-16-{u['locale']}-E{i+1:02d}-r1"
 assert source['stepId']=='S3-16' and source['locale']==u['locale']
 e=source['examples'][i]
 assert e['id']==('clock', 'cups', 'ph-method', 'feel')[i]
 pointers=[f'/examples/{i}/title',f'/examples/{i}/situation',*[f'/examples/{i}/reasoning/{j}'for j in range(len(e['reasoning']))],f'/examples/{i}/takeaway']
 assert [b['pointer']for b in u['sourceBindings']]==pointers
 for b in u['sourceBindings']:
  value=source
  for k in b['pointer'].strip('/').split('/'):value=value[int(k)]if isinstance(value,list)else value[k]
  assert value==b['text']and hashlib.sha256(value.encode()).hexdigest()==b['sha256']
 assert u['voice']==('Charon'if i%2==0 else'Kore')
 assert (u['maximumProviderCalls'],u['maximumBlindAudioReviewCalls'],u['maximumASRInvocations'],u['automaticRetries'])==(1,1,1,0)
 return True
