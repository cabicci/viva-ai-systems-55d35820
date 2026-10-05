"""Lossless schema adaptation for review artifacts; never fabricates missing content."""
import argparse, copy, json
from pathlib import Path
from expand_lessons import validate

def normalize(source):
    d = copy.deepcopy(source)
    changes = []
    for parent, key, field, allowed in [
        (d['example'], 'steps', 'explanation', {'step', 'explanation'}),
        (d['example'], 'steps', 'explainedSolution', {'step', 'explainedSolution'}),
        (d, 'videoVisualPlan', 'description', {'scene', 'description'}),
    ]:
        for i, value in enumerate(parent[key]):
            if isinstance(value, dict) and set(value) <= allowed and isinstance(value.get(field), str):
                parent[key][i] = value[field]
                changes.append(f'{key}[{i}]: extracted {field}; ordering retained')
    return d, changes

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('input', type=Path)
    p.add_argument('output', type=Path)
    a = p.parse_args()
    report = []
    for path in sorted(a.input.glob('**/AC-*.json')):
        d, changes = normalize(json.loads(path.read_text()))
        try:
            validate(d, d['id'], d['locale'])
        except Exception as e:
            report.append({'path': str(path), 'status': 'INVALID', 'error': str(e)})
            continue
        dest = a.output / d['locale'] / path.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
        report.append({'path': str(path), 'status': 'NORMALIZED', 'changes': changes})
    a.output.mkdir(parents=True, exist_ok=True)
    (a.output / 'normalization.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'valid': sum(r['status'] == 'NORMALIZED' for r in report), 'invalid': [r for r in report if r['status'] == 'INVALID']}, ensure_ascii=False))
