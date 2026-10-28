#!/usr/bin/env python3
"""Serve only the release's web assets, with a separate test-storage namespace."""
import argparse
import http.server
import ipaddress
import json
from pathlib import Path
import socket
import subprocess
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
ASSETS = {'index.html', 'app.js', 'compact.js', 'styles.css', 'version.js', 'sw.js', 'manifest.webmanifest'}
STORAGE = 'evvQuickScout_FINAL_RC_TEST'


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        name = urlsplit(self.path).path.lstrip('/') or 'index.html'
        if name not in ASSETS:
            self.send_error(404)
            return
        body = (ROOT / name).read_bytes()
        if name == 'app.js':
            body = body.replace(b'evvQuickScoutV77', STORAGE.encode())
        elif name == 'sw.js':
            body = body.replace(b'evv-quickscout-v', b'evv-quickscout-final-rc-test-v')
        elif name == 'index.html':
            banner = ('<aside style="background:#ffdf80;color:#181818;padding:10px;text-align:center;'
                      'font:600 15px sans-serif">V8 RELEASE-KANDIDAT · TESTBETRIEB · '
                      'Nur erfundene Spiele, keine echten Backups</aside>')
            body = body.replace(b'<body>', ('<body>' + banner).encode())
        elif name == 'manifest.webmanifest':
            manifest = json.loads(body)
            manifest.update(name='EVV QuickScout RC TEST', short_name='EVV RC TEST')
            body = json.dumps(manifest).encode()
        kind = {'html': 'text/html', 'js': 'application/javascript', 'css': 'text/css',
                'webmanifest': 'application/manifest+json'}[name.rsplit('.', 1)[-1]]
        self.send_response(200)
        self.send_header('Content-Type', kind + '; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def wlan_addresses():
    found = set()
    for interface in ('en0', 'en1', 'en2'):
        try:
            value = subprocess.check_output(['ipconfig', 'getifaddr', interface], stderr=subprocess.DEVNULL, text=True).strip()
            ip = ipaddress.ip_address(value)
            if not ip.is_loopback and ip.version == 4:
                found.add(str(ip))
        except (OSError, ValueError, subprocess.CalledProcessError):
            pass
    if not found:
        try:
            for value in socket.gethostbyname_ex(socket.gethostname())[2]:
                ip = ipaddress.ip_address(value)
                if not ip.is_loopback and ip.version == 4:
                    found.add(str(ip))
        except (OSError, ValueError):
            pass
    return sorted(found)


def main():
    parser = argparse.ArgumentParser(description='EVV QuickScout Release-Kandidat: lokaler Testserver')
    parser.add_argument('--lan', action='store_true', help='Für Geräte im selben vertrauenswürdigen WLAN freigeben')
    parser.add_argument('--port', type=int, default=18764, help='0 wählt automatisch einen freien Port')
    args = parser.parse_args()
    missing = [name for name in ASSETS if not (ROOT / name).is_file()]
    if missing:
        parser.error('Paket unvollständig: ' + ', '.join(sorted(missing)))
    try:
        server = http.server.ThreadingHTTPServer(('0.0.0.0' if args.lan else '127.0.0.1', args.port), Handler)
    except OSError as exc:
        parser.exit(1, f'Serverstart fehlgeschlagen: {exc}\nAnderen Port mit --port wählen.\n')
    with server:
        port = server.server_address[1]
        print(f'Mac: http://127.0.0.1:{port}/', flush=True)
        if args.lan:
            addresses = wlan_addresses()
            for address in addresses:
                print(f'iPad/WLAN: http://{address}:{port}/', flush=True)
            if not addresses:
                print('WLAN-IP in macOS Systemeinstellungen > Netzwerk nachsehen; dieselbe Portnummer verwenden.', flush=True)
        print('Nur Testdaten. Kein Upload. Beenden mit Ctrl+C.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
