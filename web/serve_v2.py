#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP server for assaybio_v2 directory
"""
import http.server
import socketserver
import os
import argparse

def start_server(directory="assaybio_v2", port=4400):
    """Start HTTP server in specified directory"""
    
    # Change to the specified directory
    if os.path.exists(directory):
        os.chdir(directory)
        print(f"Serving from directory: {os.getcwd()}")
    else:
        print(f"Directory {directory} not found!")
        return
    
    # Create server
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", port), Handler)
    
    print(f"Server started at http://127.0.0.1:{port}/")
    print(f"访问主页: http://127.0.0.1:{port}/index.html")
    print(f"查看索引: http://127.0.0.1:{port}/site_index.html")
    print("按 Ctrl+C 停止服务器")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.shutdown()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='启动本地HTTP服务器 (v2)')
    parser.add_argument('--port', '-p', type=int, default=4400, help='端口号 (默认: 4400)')
    parser.add_argument('--dir', '-d', type=str, default='assaybio_v2', help='目录 (默认: assaybio_v2)')
    
    args = parser.parse_args()
    start_server(args.dir, args.port)