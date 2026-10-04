#!/usr/bin/env python3
"""Offline integrity gate. This does not certify technical or language accuracy."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path

LOCALES = ('ar-EG', 'ar-MSA', 'ar-Gulf', 'en')
BASELINE = {'M01-L01', 'M01-L02', 'M01-L03', 'M01-L04', 'M04-L02'}
FORBIDDEN = re.compile(r'Metwood|source_pdf_pages|library_file_id|sourceNote|صفحات الكتاب|الكتاب المرجعي', re.I)


def require(ok, message, errors):
    if not ok:
        errors.append(message)


def validate_package(pkg, lesson_id, locale):
    errors = []
    require(pkg.get('id') == lesson_id, 'lesson identity mismatch', errors)
    require(pkg.get('locale') == locale, 'locale identity mismatch', errors)
    for key in ('title', 'intro'):
        require(isinstance(pkg.get(key), str) and bool(pkg[key].strip()), f'missing {key}', errors)
    require(not FORBIDDEN.search(json.dumps(pkg, ensure_ascii=False)), 'learner source leakage', errors)
    goals = pkg.get('goals', [])
    require(len(goals) >= 3 and all(isinstance(g, str) and g.strip() for g in goals), 'three goals required', errors)
    sections = pkg.get('sections', [])
    require(len(sections) >= 3, 'three explanation sections required', errors)
    ids = [s.get('id') for s in sections]
    diagrams = [s.get('diagram') for s in sections]
    require(len(set(ids)) == len(ids), 'duplicate section identity', errors)
    require(len(set(diagrams)) == len(diagrams), 'repeated explanation illustration', errors)
    for section in sections:
        require(all(isinstance(section.get(k), str) and section[k].strip() for k in ('id', 'title', 'text', 'diagram', 'caption')), 'incomplete explanation section', errors)
        require(len(section.get('text', '').split()) >= 25, 'explanation lacks detail', errors)
    example = pkg.get('example', {})
    require(all(isinstance(example.get(k), str) and example[k].strip() for k in ('title', 'text', 'decision')), 'worked decision case required', errors)
    quiz = pkg.get('quiz', [])
    require(len(quiz) >= 1, 'objective question required', errors)
    require(len({q.get('id') for q in quiz}) == len(quiz), 'duplicate question identity', errors)
    for question in quiz:
        options, correct = question.get('options', []), question.get('correct')
        require(len(options) >= 3 and len(set(options)) == len(options), 'three distinct quiz options required', errors)
        require(type(correct) is int and 0 <= correct < len(options), 'answer index invalid', errors)
        require(all(isinstance(question.get(k), str) and question[k].strip() for k in ('id', 'question', 'explanation')), 'incomplete objective question', errors)
    assignment = pkg.get('assignment', {})
    require(bool(assignment.get('prompt')), 'practice prompt required', errors)
    for key in ('fields', 'criteria'):
        require(len(assignment.get(key, [])) == 3, f'practice needs three {key}', errors)
    faq = pkg.get('faq', [])
    require(bool(faq), 'lesson FAQ required', errors)
    for item in faq:
        require(item.get('sectionId') in ids, 'FAQ targets absent section', errors)
        require(bool(item.get('question')) and bool(item.get('answer')), 'incomplete FAQ', errors)
    return errors


def canonical_structure(pkg):
    return {
        'sections': [(s['id'], s['diagram']) for s in pkg.get('sections', [])],
        'assessment': [(q['id'], q['correct'], len(q['options'])) for q in pkg.get('quiz', [])],
        # Numeral facts, units and options must stay consistent; spoken words are separate.
        'numerals': sorted(set(re.findall(r'(?<![A-Za-z])\d+(?:[.,]\d+)?', json.dumps(pkg, ensure_ascii=False)))),
    }


def audit(root, complete=False):
    curriculum = json.loads((root / 'docs/experiments/technical-education/curriculum-map.json').read_text())
    catalog = json.loads((root / 'src/lib/technical-education/catalog.json').read_text())
    expected = {lesson['id'] for lesson in curriculum['lessons']}
    errors = []
    require(len(expected) == 80, 'expected 80 unique catalogue lesson IDs', errors)
    require({lesson['id'] for lesson in catalog['lessons']} == expected, 'runtime/curriculum identity mismatch', errors)
    package_dir = root / 'src/lib/technical-education/lessons'
    packages = {}
    for file in sorted(package_dir.glob('*.json')):
        match = re.fullmatch(r'(M\d{2}-L\d{2})__(ar-EG|ar-MSA|ar-Gulf|en)\.json', file.name)
        if not match:
            errors.append(f'{file.name}: unexpected package filename')
            continue
        lesson_id, locale = match.groups()
        require(lesson_id in expected and lesson_id != 'M04-L02', f'{file.name}: unknown or duplicate pilot package', errors)
        pkg = json.loads(file.read_text())
        errors.extend(f'{file.name}: {error}' for error in validate_package(pkg, lesson_id, locale))
        packages.setdefault(lesson_id, {})[locale] = pkg
    asset_hashes = {}
    for lesson_id, localized in packages.items():
        require(set(localized) == set(LOCALES), f'{lesson_id}: incomplete four-register package', errors)
        reference = canonical_structure(next(iter(localized.values())))
        for locale, pkg in localized.items():
            require(canonical_structure(pkg) == reference, f'{lesson_id}/{locale}: concept, answer or numeral fact drift', errors)
            prefix = f'{lesson_id}/{locale}'
            for section in pkg['sections']:
                asset = root / f'public/experiments/technical-education/{locale}/{section["diagram"]}.svg'
                require(asset.is_file(), f'{prefix}: missing illustration {section["diagram"]}', errors)
                if asset.is_file():
                    svg = asset.read_text()
                    require('<svg' in svg and '</svg>' in svg, f'{prefix}: invalid SVG', errors)
                    geometry = re.sub(r'data-diagram="[^"]*"|aria-label="[^"]*"|<title>.*?</title>', '', svg)
                    digest = hashlib.sha256(geometry.encode()).hexdigest()
                    prior = asset_hashes.get((locale, digest))
                    require(prior in (None, section['diagram']), f'{prefix}: illustration repeats {prior}', errors)
                    asset_hashes[(locale, digest)] = section['diagram']
            for kind in ('workbook', 'worksheet'):
                pdf = root / f'public/experiments/technical-education/{locale}/{lesson_id}/{kind}.pdf'
                require(pdf.is_file() and pdf.read_bytes().startswith(b'%PDF-'), f'{prefix}: missing/invalid {kind} PDF', errors)
    authored = {lesson_id for lesson_id, pkgs in packages.items() if set(pkgs) == set(LOCALES)} | {'M04-L02'}
    missing = sorted(expected - authored)
    if complete:
        require(not missing, f'completion denied: {len(missing)} lessons remain unauthored', errors)
    return {
        'gate': 'fail' if errors else 'pass',
        'scope': 'offline structural integrity only; no technical, pronunciation, listener or publication acceptance',
        'baseline_authored_ids': sorted(BASELINE),
        'authored_lesson_count': len(authored),
        'new_authored_lesson_count': len(authored - BASELINE),
        'new_localized_package_count': sum(len(pkgs) for lesson_id, pkgs in packages.items() if lesson_id not in BASELINE),
        'missing_lesson_count': len(missing),
        'missing_lesson_ids': missing,
        'errors': errors,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--require-complete', action='store_true')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = audit(args.root, args.require_complete)
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(rendered)
    print(rendered)
    raise SystemExit(bool(result['errors']))


if __name__ == '__main__':
    main()
