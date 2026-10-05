"""Apply reviewed, exact-match content corrections; reject drift instead of guessing."""
import argparse, json
from pathlib import Path

def apply(root, patches):
    count = 0
    for patch in patches:
        path = root / patch['locale'] / (patch['lessonId'] + '.json')
        d = json.loads(path.read_text())
        target = d
        for part in patch['path'][:-1]:
            target = target[part]
        key = patch['path'][-1]
        if target[key] == patch['after']:
            continue
        if target[key] != patch['before']:
            raise ValueError(f"Editorial patch drift: {patch['locale']}/{patch['lessonId']}/{patch['path']}")
        target[key] = patch['after']
        path.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
        count += 1
    return count

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('input', type=Path)
    p.add_argument('--patches', type=Path, default=Path(__file__).with_name('editorial-corrections.json'))
    a = p.parse_args()
    print({'applied': apply(a.input, json.loads(a.patches.read_text()))})
