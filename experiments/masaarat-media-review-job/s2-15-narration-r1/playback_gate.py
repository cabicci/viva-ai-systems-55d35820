"""Explicit disclosure selection, not a playlist or permission to auto-concatenate."""
def select_for_playback(request, locale, attempt=None):
    out=[]
    for unit in request['units']:
        if unit['locale']!=locale:continue
        gate=unit['releaseGate']
        if gate['kind']=='AFTER_MATCHING_FIELD_B_ATTEMPT':
            if not (isinstance(attempt,dict) and attempt.get('caseId')==gate['caseId'] and attempt.get('locale')==locale and isinstance(attempt.get('response'),str) and attempt['response'].strip()):continue
        else:assert gate['kind']=='TEACHING_OR_CASE_PROMPT_ONLY'
        out.append({key:unit[key] for key in ['id','locale','voice','spokenText','displayText','captionText','releaseGate']})
    return out
