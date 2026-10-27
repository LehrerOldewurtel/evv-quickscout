#!/usr/bin/env bash
# Optional Debian 13 cloud setup without root; no changes to /etc or system packages.
set -euo pipefail
cd "$(dirname "$0")/.."
export PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright
export XDG_CACHE_HOME=/workspace/.cache
task_apt_dir=/workspace/.evv-apt
task_lib_root=/workspace/.evv-webkit-libs
mkdir -p "$task_apt_dir/lists/partial" "$task_apt_dir/archives/partial" "$task_apt_dir/empty" "$task_apt_dir/debs" "$task_lib_root"
export EVV_BROWSER_DEBS
EVV_BROWSER_DEBS=$(mktemp -d "$task_apt_dir/debs/current.XXXXXX")
printf '%s\n' 'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian trixie main' > "$task_apt_dir/sources.list"
task_apt_options=(-o "Dir::Etc::Parts=$task_apt_dir/empty" -o "Dir::Etc::sourcelist=$task_apt_dir/sources.list" -o "Dir::Etc::sourceparts=$task_apt_dir/empty" -o "Dir::State::lists=$task_apt_dir/lists" -o "Dir::Cache::archives=$task_apt_dir/archives")
apt-get "${task_apt_options[@]}" -o APT::Update::Error-Mode=any update
# APT authenticates InRelease through the explicit signed-by keyring above.
(
 cd "$EVV_BROWSER_DEBS"
 apt-get "${task_apt_options[@]}" download libgtk-4-1 libgraphene-1.0-0 libwoff1 libharfbuzz-icu0 libhyphen0 libmanette-0.2-0 libgles2 libcairo-script-interpreter2 libhidapi-hidraw0 libglvnd0 libpci3 liblzo2-2
)
python3 - <<'PY'
from pathlib import Path
import hashlib,json,subprocess,os
base=Path('/workspace/.evv-apt'); root=Path('/workspace/.evv-webkit-libs'); packages=[]
opts=['-o',f'Dir::Etc::Parts={base}/empty','-o',f'Dir::Etc::sourcelist={base}/sources.list','-o',f'Dir::Etc::sourceparts={base}/empty','-o',f'Dir::State::lists={base}/lists']
for file in sorted(Path(os.environ['EVV_BROWSER_DEBS']).glob('*.deb')):
 package=subprocess.check_output(['dpkg-deb','-f',str(file),'Package'],text=True).strip()
 version=subprocess.check_output(['dpkg-deb','-f',str(file),'Version'],text=True).strip()
 control=subprocess.check_output(['apt-cache',*opts,'show',f'{package}={version}'],text=True)
 expected=next(line.split(':',1)[1].strip() for line in control.splitlines() if line.startswith('SHA256:'))
 actual=hashlib.sha256(file.read_bytes()).hexdigest()
 if actual!=expected:raise RuntimeError('Debian package checksum mismatch: '+package)
 subprocess.run(['dpkg-deb','-x',str(file),str(root)],check=True)
 packages.append({'package':package,'version':version,'sha256':actual})
(root/'verified-packages.json').write_text(json.dumps({'source':'Debian trixie, signed InRelease and SHA256 checked','packages':packages},indent=2)+'\n')
PY
npx playwright install firefox webkit
printf '%s\n' 'For rootless WebKit package tests set:' 'PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright' 'XDG_CACHE_HOME=/workspace/.cache' 'EVV_BROWSER_LIBS=/workspace/.evv-webkit-libs/usr/lib/x86_64-linux-gnu' 'EVV_QA_BROWSERS=chromium,webkit'
