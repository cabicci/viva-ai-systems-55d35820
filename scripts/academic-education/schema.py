"""Provider response schema; editorial acceptance is a separate gate."""
S = {'type': 'STRING'}
def arr(item, count=None):
    return {'type': 'ARRAY', 'items': item, **({'minItems': count, 'maxItems': count} if count else {})}
def obj(**fields):
    return {'type': 'OBJECT', 'properties': fields, 'required': list(fields), 'propertyOrdering': list(fields)}
LESSON_SCHEMA = obj(
    id=S, locale=S, title=S, intro=S, goals=arr(S, 4),
    sections=arr(obj(id=S, title=S, text=S, reflection=S), 6),
    example=obj(title=S, text=S, decision=S, steps=arr(S, 5)),
    quiz=arr(obj(id=S, question=S, options=arr(S, 4), correct={'type': 'INTEGER', 'minimum': 0, 'maximum': 3}, explanation=S), 6),
    assignment=obj(prompt=S, fields=arr(S, 5), criteria=arr(S, 5), rubric=arr(obj(criterion=S, excellent=S, adequate=S, needsRevision=S), 5)),
    faq=arr(obj(question=S, answer=S), 3), summary=arr(S, 4),
    readingVisuals=arr(obj(id=S, title=S, kind={'type': 'STRING', 'enum': ['flow', 'comparison', 'table']},
        columns={'type': 'ARRAY', 'items': S, 'minItems': 2, 'maxItems': 3},
        rows={'type': 'ARRAY', 'items': {'type': 'ARRAY', 'items': S, 'minItems': 2, 'maxItems': 3}, 'minItems': 2, 'maxItems': 8}, caption=S), 3),
    videoVisualPlan=arr(S, 3),
)
