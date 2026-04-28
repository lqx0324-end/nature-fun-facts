#!/usr/bin/env python3
"""Local development server with image proxy and disk cache."""

import http.server
import socketserver
import urllib.request
import urllib.parse
import hashlib
import os
import io
import time

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, '.image_cache')

# Bypass system proxy (e.g. Privoxy) for upstream requests
os.environ['no_proxy'] = '*'
os.environ['NO_PROXY'] = '*'
for k in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']:
    os.environ.pop(k, None)

os.makedirs(CACHE_DIR, exist_ok=True)


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        if self.path.startswith('/api/image'):
            try:
                self._proxy_image()
            except Exception as e:
                print(f'Proxy handler error: {e}')
                try:
                    self.send_error(502, 'Image proxy failed')
                except Exception:
                    pass
        else:
            super().do_GET()

    def _proxy_image(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        prompt = params.get('prompt', [''])[0]
        width = params.get('width', ['400'])[0]
        height = params.get('height', ['267'])[0]
        seed = params.get('seed', ['1'])[0]

        if not prompt:
            self.send_error(400, 'Missing prompt parameter')
            return

        # Disk cache key
        cache_key = hashlib.md5(f'{prompt}|{width}|{height}|{seed}'.encode()).hexdigest()
        cache_file = os.path.join(CACHE_DIR, f'{cache_key}.jpg')

        # Serve from cache if exists
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'rb') as f:
                    data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg')
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Cache-Control', 'public, max-age=86400')
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception:
                pass

        # Fetch from Pollinations with retry
        pollinations_url = (
            f'https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}'
            f'?width={width}&height={height}&seed={seed}&nologo=true'
        )

        data = None
        for attempt in range(3):
            try:
                proxy_handler = urllib.request.ProxyHandler({})
                opener = urllib.request.build_opener(proxy_handler)
                req = urllib.request.Request(pollinations_url)
                req.add_header('User-Agent', 'Mozilla/5.0')
                with opener.open(req, timeout=90) as resp:
                    data = resp.read()
                if len(data) < 1000:
                    raise Exception(f'Suspiciously small response: {len(data)} bytes')
                break
            except Exception as e:
                if attempt < 2:
                    print(f'Retry {attempt+1}/3 for "{prompt}": {e}')
                    time.sleep(3)
                else:
                    print(f'Image proxy error for "{prompt}" after 3 attempts: {e}')
                    self.send_error(502, f'Upstream error: {e}')
                    return

        # Save to disk cache
        try:
            with open(cache_file, 'wb') as f:
                f.write(data)
        except Exception:
            pass

        self.send_response(200)
        self.send_header('Content-Type', 'image/jpeg')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'public, max-age=86400')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        # Suppress noisy logs for static files
        if '/api/image' in (args[0] if args else ''):
            return
        super().log_message(format, *args)


class RobustServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Silently handle broken pipe / client disconnect instead of crashing
        pass


if __name__ == '__main__':
    with RobustServer(('', PORT), ProxyHandler) as httpd:
        print(f'自然冷知识应用已启动！')
        print(f'请在浏览器中打开: http://localhost:{PORT}')
        print(f'图片缓存目录: {CACHE_DIR}')
        print(f'按 Ctrl+C 停止服务器')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n服务器已停止。')