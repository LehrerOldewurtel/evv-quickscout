from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import os
root=Path(__file__).parent
os.chdir(root)
server=ThreadingHTTPServer(('127.0.0.1',0),SimpleHTTPRequestHandler);Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_address[1]}/index.html'
results=[]
def test(name,fn):
 try: fn();results.append((name,'PASS'))
 except Exception as e: results.append((name,'FAIL '+str(e)[:240]))
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url);page.wait_for_timeout(250)
 test('Initial JS runtime',lambda: (not errors) or (_ for _ in ()).throw(Exception(errors)))
 test('Build version',lambda: page.locator('#buildLabel').inner_text()=='V7.8.0' or (_ for _ in ()).throw(Exception('version mismatch')))
 page.locator('#startReceive').click()
 test('Start K1',lambda: page.locator('#flow').inner_text().find('K1 · Annahme')>=0 or (_ for _ in ()).throw(Exception(page.locator('#flow').inner_text()[:200])))
 page.locator('[data-act="rec|michael|A0"]').click()
 test('A0 does not auto-score',lambda: (page.locator('#oppScore').inner_text()=='0' and 'Ball noch spielbar' in page.locator('#flow').inner_text()) or (_ for _ in ()).throw(Exception('A0 auto point')))
 page.locator('[data-act="a0|SAVED"]').click()
 test('A0 saved continues',lambda: '2. Ball' in page.locator('#flow').inner_text() or (_ for _ in ()).throw(Exception('no continuation')))
 page.locator('[data-act="back"]').click()
 test('Back restores A0 decision',lambda: 'Ball noch spielbar' in page.locator('#flow').inner_text() or (_ for _ in ()).throw(Exception('back failed')))
 page.locator('[data-act="a0|LOST"]').click()
 test('A0 confirmed lost scores once',lambda: page.locator('#oppScore').inner_text()=='1' or (_ for _ in ()).throw(Exception('wrong score')))
 page.locator('#undo').click()
 test('Undo score and rally',lambda: (page.locator('#oppScore').inner_text()=='0' and len(page.evaluate('window.EVV_QS_TEST.state().rallies'))==0) or (_ for _ in ()).throw(Exception('undo failed')))
 page.locator('[data-act="quick|EVV"]').click()
 test('K1 sideout rotates',lambda: (page.locator('#homeScore').inner_text()=='1' and page.locator('#phase').inner_text()=='K2') or (_ for _ in ()).throw(Exception('sideout failed')))
 page.locator('[data-act="serve|ERR"]').click()
 test('Serve error switches K1',lambda: (page.locator('#oppScore').inner_text()=='1' and page.locator('#phase').inner_text()=='K1') or (_ for _ in ()).throw(Exception('serve error failed')))
 test('No runtime errors',lambda: (not errors) or (_ for _ in ()).throw(Exception(errors)))
 browser.close()
server.shutdown()
for n,r in results:print(r,n)
print('TOTAL',sum(r=='PASS' for _,r in results),'/',len(results))
raise SystemExit(0 if all(r=='PASS' for _,r in results) else 1)
