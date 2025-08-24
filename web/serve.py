#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP server to serve the downloaded website locally
"""
import http.server
import socketserver
import os
import webbrowser
import argparse

def start_server(directory="backup_site", port=4400):
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
    print(f"访问主页: http://127.0.0.1:{port}/html/index.html")
    print("按 Ctrl+C 停止服务器")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.shutdown()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='启动本地HTTP服务器')
    parser.add_argument('--port', '-p', type=int, default=4400, help='端口号 (默认: 4400)')
    parser.add_argument('--dir', '-d', type=str, default='backup_site', help='目录 (默认: backup_site)')
    
    args = parser.parse_args()
    start_server(args.dir, args.port)