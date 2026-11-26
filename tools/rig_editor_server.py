"""Local server for the rig editor (demos/rig-editor). Serves the repository and saves the edited plan.
Usage: python3 tools/rig_editor_server.py [port]   then open http://localhost:<port>/demos/rig-editor/?char=zeus
POST /api/save?char=<name>  body = rig_plan.json  →  keeps a backup, writes assets/characters/<name>/rig_plan.json, runs tools/assemble_rig.py.
Listens on 127.0.0.1 only."""
import http.server, json, os, re, shutil, subprocess, sys, time, urllib.parse
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(self): self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_POST(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query); name = (q.get('char') or [''])[0]
        if u.path != '/api/save' or not re.fullmatch(r'[a-z0-9_-]+', name): return self.reply(400, {'error': 'bad request'})
        d = os.path.join(ROOT, 'assets', 'characters', name)
        try:
            plan = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
            assert isinstance(plan.get('bones'), list) and plan['bones'], 'plan has no bones'
        except Exception as e: return self.reply(400, {'error': f'invalid plan: {e}'})
        p = os.path.join(d, 'rig_plan.json'); bk = os.path.join(d, 'backups'); os.makedirs(bk, exist_ok=True)
        if os.path.exists(p): shutil.copy(p, os.path.join(bk, time.strftime('rig_plan-%Y%m%d-%H%M%S.json')))
        json.dump(plan, open(p, 'w'), indent=1, ensure_ascii=False)
        r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'assemble_rig.py'), d], capture_output=True, text=True)
        self.reply(200 if r.returncode == 0 else 500, {'ok': r.returncode == 0, 'log': (r.stdout + r.stderr).strip()})
    def reply(self, code, obj): b = json.dumps(obj).encode(); self.send_response(code); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
URL = f'http://localhost:{PORT}/demos/rig-editor/?char=zeus'
try: srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), H)
except OSError as e:
    if e.errno in (48, 98): sys.exit(f'A porta {PORT} já está em uso: o editor provavelmente já está rodando. Abra {URL}\n(ou use outra porta: python3 tools/rig_editor_server.py 8766)')
    raise
print('rig editor:', URL, flush=True); srv.serve_forever()
