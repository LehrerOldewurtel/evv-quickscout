#!/usr/bin/env python3
"""Build a real, checksummed test-only release candidate from current QA evidence."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ['index.html', 'app.js', 'compact.js', 'styles.css', 'version.js', 'sw.js', 'manifest.webmanifest']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/EVV-QuickScout-V8-RC.zip')
    args = parser.parse_args()
    report = json.loads((ROOT / 'artifacts/release-candidate.json').read_text())
    assert report['run']['node']['exitCode'] == report['run']['browser']['exitCode'] == 0, 'QA process failed'
    assert report['node']['failed'] == report['node']['cancelled'] == report['node']['skipped'] == 0, 'Node gate not green'
    assert report['browser']['unexpected'] == report['browser']['flaky'] == report['browser']['skipped'] == 0, 'Browser gate not green'
    assert report['simulations']['detailed']['matches'] >= 100, 'Fewer than 100 detailed matches'
    assert all(digest(ROOT / f) == report['run']['source']['assets'][f] for f in ASSETS), 'Assets changed since QA'
    git = lambda *cmd: subprocess.check_output(['git', *cmd], cwd=ROOT, text=True).strip()
    build = {'kind': 'V8 final release candidate for manual acceptance', 'branch': git('branch', '--show-current') or os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or 'detached',
             'commit': git('rev-parse', 'HEAD'), 'productVersionUnchanged': True,
             'workingTreeDirty': bool(git('status', '--porcelain')),
             'qaGeneratedAt': report['generatedAt'], 'qaSourceCommit': report['run']['source']['commit'],
             'assets': {f: digest(ROOT / f) for f in ASSETS}, 'storageNamespace': 'evvQuickScout_FINAL_RC_TEST',
             'productionDeployment': False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='evv-package-') as tmp:
        stage = Path(tmp)
        for name in ASSETS:
            (stage / name).write_bytes((ROOT / name).read_bytes())
        for name in ['TEST_START.py', 'ANLEITUNG.txt', 'KNOWN_LIMITATIONS.txt']:
            (stage / name).write_bytes((ROOT / 'release' / name).read_bytes())
        (stage / 'BUILD.json').write_text(json.dumps(build, indent=2) + '\n')
        (stage / 'TESTBERICHT.md').write_text((ROOT / 'artifacts/release-candidate.md').read_text().replace('../../RELEASE_CANDIDATE_REPORT.md', 'RELEASE_ABNAHME.md'))
        (stage / 'TESTBERICHT.json').write_bytes((ROOT / 'artifacts/release-candidate.json').read_bytes())
        webkit_assets = ROOT / 'docs/qa/final/webkit-assets.json'
        if webkit_assets.is_file() and json.loads(webkit_assets.read_text()) == build['assets']:
            (stage / 'WEBKIT_TESTBERICHT.json').write_bytes((ROOT / 'docs/qa/final/webkit-focused.json').read_bytes())
        (stage / 'RELEASE_ABNAHME.md').write_bytes((ROOT / 'docs/FINAL_RELEASE_REPORT.md').read_bytes())
        (stage / 'CHECKSUMS.sha256').write_text(''.join(f'{digest(p)}  {p.name}\n' for p in sorted(stage.iterdir())))
        with zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED) as archive:
            for file in sorted(stage.iterdir()):
                archive.write(file, 'EVV-QuickScout-V8-RC/' + file.name)
    assert args.output.is_file() and args.output.stat().st_size > 0
    checksum = digest(args.output)
    args.output.with_suffix('.zip.sha256').write_text(f'{checksum}  {args.output.name}\n')
    print(json.dumps({'zip': str(args.output), 'bytes': args.output.stat().st_size, 'sha256': checksum, 'build': build}, indent=2))


if __name__ == '__main__':
    main()
