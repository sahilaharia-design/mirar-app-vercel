#!/usr/bin/env python3
"""
Checks that a PUBLIC web bundle exposes no privileged credential. Prints facts only; it never prints a token or secret.

Usage:
  python3 scripts/release/check-public-bundle.py https://mirar-app.vercel.app
  python3 scripts/release/check-public-bundle.py --dir /path/to/dist     (a local `expo export` output)

Pass criteria: every JWT found decodes to role "anon" (the Supabase anon key is public by design); no admin/service literals.
"""
import sys, re, json, base64, os, urllib.request

JWT = re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}')
LITERALS = ['x-admin-secret', 'ADMIN_SECRET', 'service_role', 'SERVICE_ROLE', 'EXPO_PUBLIC_ADMIN_SECRET', 'demo@mirar.life', 'sel_bias_A', 'DEFAULT_TRAITS']

def fetch(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={'Cache-Control': 'no-cache', 'User-Agent': 'release-check'})).read().decode('utf8', 'ignore')

def files_from_url(base):
    html = fetch(base.rstrip('/') + '/?cb=%d' % os.getpid())
    for src in re.findall(r'src="([^"]+\.js)"', html):
        yield src, fetch(base.rstrip('/') + src)

def files_from_dir(d):
    for root, _, names in os.walk(d):
        for n in names:
            if n.endswith('.js'):
                yield os.path.join(root, n)[len(d):], open(os.path.join(root, n), errors='ignore').read()

def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    src = files_from_dir(sys.argv[2]) if sys.argv[1] == '--dir' else files_from_url(sys.argv[1])
    ok = True
    for name, text in src:
        roles = {}
        for t in set(JWT.findall(text)):
            p = t.split('.')[1]; p += '=' * (-len(p) % 4)
            try: r = json.loads(base64.urlsafe_b64decode(p)).get('role', 'none')
            except Exception: r = 'undecodable'
            roles[r] = roles.get(r, 0) + 1
        found = [l for l in LITERALS if l in text]
        bad = any(r != 'anon' for r in roles) or bool(found)
        ok &= not bad
        print(('FAIL ' if bad else 'ok   ') + name.split('/')[-1][:40], 'JWT roles:', roles or '{}', 'literals:', found or 'none')
    print('RESULT:', 'PASS' if ok else 'FAIL')
    sys.exit(0 if ok else 1)
main()
