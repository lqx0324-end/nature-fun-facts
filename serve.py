#!/usr/bin/env python3
"""简单的本地 HTTP 服务器，用于运行自然冷知识应用。
使用方法：双击此文件或在终端运行 python serve.py
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

os.chdir(DIRECTORY)

handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), handler) as httpd:
    url = f"http://localhost:{PORT}"
    print(f"自然冷知识应用已启动！")
    print(f"请在浏览器中打开: {url}")
    print(f"按 Ctrl+C 停止服务器")
    webbrowser.open(url)
    httpd.serve_forever()
