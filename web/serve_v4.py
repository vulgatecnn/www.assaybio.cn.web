#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP server for assaybio_v4 directory
"""
import http.server
import socketserver
import os
import argparse

def start_server(directory="assaybio_v4", port=4400):
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
    print(f"关于我们: http://127.0.0.1:{port}/info.aspx_id_00010001.html")
    print(f"文献资料: http://127.0.0.1:{port}/info.aspx_id_00050001.html")
    print(f"市场动向: http://127.0.0.1:{port}/info.aspx_id_00020001.html")
    print(f"产品页面: http://127.0.0.1:{port}/info.aspx_id_00070001.html")
    print("按 Ctrl+C 停止服务器")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.shutdown()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='启动本地HTTP服务器 (v4)')
    parser.add_argument('--port', '-p', type=int, default=4400, help='端口号 (默认: 4400)')
    parser.add_argument('--dir', '-d', type=str, default='assaybio_v4', help='目录 (默认: assaybio_v4)')
    
    args = parser.parse_args()
    start_server(args.dir, args.port)