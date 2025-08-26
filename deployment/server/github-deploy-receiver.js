#!/usr/bin/env node

/**
 * GitHub自动部署接收服务
 * 在192.3.11.106服务器上运行，接收GitHub的部署触发请求
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

// 配置
const CONFIG = {
  port: 3000,
  webroot: '/var/www/html',
  backupDir: '/var/backups/website',
  logFile: '/var/log/github-deploy.log',
  githubRepo: 'https://github.com/你的用户名/你的仓库名', // 请替换为实际仓库地址
  webhookSecret: 'your-webhook-secret-key', // GitHub Webhook密钥
  allowedIPs: ['140.82.112.0/20', '192.30.252.0/22'] // GitHub IP范围
};

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}\n`;
  console.log(logMessage.trim());
  
  // 写入日志文件
  fs.appendFileSync(CONFIG.logFile, logMessage, { flag: 'a' });
}

// 验证GitHub签名
function verifyGitHubSignature(payload, signature) {
  if (!CONFIG.webhookSecret || !signature) return true; // 如果未配置密钥，跳过验证
  
  const hmac = crypto.createHmac('sha256', CONFIG.webhookSecret);
  hmac.update(payload);
  const computed = 'sha256=' + hmac.digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}

// 执行Shell命令
function executeCommand(command, callback) {
  log(`执行命令: ${command}`);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      log(`命令执行错误: ${error.message}`, 'ERROR');
      callback(error, null);
      return;
    }
    if (stderr) {
      log(`命令警告: ${stderr}`, 'WARN');
    }
    log(`命令输出: ${stdout}`);
    callback(null, stdout);
  });
}

// 创建备份
function createBackup(callback) {
  const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.tar.gz`;
  const backupPath = path.join(CONFIG.backupDir, backupName);
  
  // 确保备份目录存在
  executeCommand(`mkdir -p ${CONFIG.backupDir}`, (err) => {
    if (err) return callback(err);
    
    // 创建备份
    const backupCmd = `cd ${CONFIG.webroot} && tar -czf ${backupPath} * 2>/dev/null || true`;
    executeCommand(backupCmd, (err) => {
      if (err) return callback(err);
      log(`备份创建成功: ${backupPath}`);
      callback(null, backupPath);
    });
  });
}

// 下载并部署代码
function deployFromGitHub(commitSha, callback) {
  const tempDir = `/tmp/deploy-${Date.now()}`;
  const downloadUrl = `${CONFIG.githubRepo}/archive/${commitSha}.tar.gz`;
  
  log(`开始从GitHub部署: ${downloadUrl}`);
  
  // 创建临时目录
  executeCommand(`mkdir -p ${tempDir}`, (err) => {
    if (err) return callback(err);
    
    // 下载代码
    const downloadCmd = `cd ${tempDir} && wget -O code.tar.gz "${downloadUrl}" && tar -xzf code.tar.gz --strip-components=1`;
    executeCommand(downloadCmd, (err) => {
      if (err) return callback(err);
      
      // 部署代码
      deployCode(tempDir, callback);
    });
  });
}

// 部署代码到网站根目录
function deployCode(sourceDir, callback) {
  const deployCommands = [
    // 清理旧文件（保留备份）
    `cd ${CONFIG.webroot} && find . -maxdepth 1 ! -name '.' ! -name 'backup-*' -exec rm -rf {} + 2>/dev/null || true`,
    
    // 复制新文件
    `cd ${sourceDir} && cp -r apps/website/dist/* ${CONFIG.webroot}/ 2>/dev/null || true`,
    `cd ${sourceDir} && cp -r css ${CONFIG.webroot}/ 2>/dev/null || true`,
    `cd ${sourceDir} && cp -r js ${CONFIG.webroot}/ 2>/dev/null || true`,
    `cd ${sourceDir} && cp -r images ${CONFIG.webroot}/ 2>/dev/null || true`,
    `cd ${sourceDir} && cp -r icons ${CONFIG.webroot}/ 2>/dev/null || true`,
    `cd ${sourceDir} && cp index.html ${CONFIG.webroot}/ 2>/dev/null || true`,
    `cd ${sourceDir} && cp apps/website/temp.json ${CONFIG.webroot}/ 2>/dev/null || true`,
    
    // 设置权限
    `chown -R www-data:www-data ${CONFIG.webroot} 2>/dev/null || chown -R nginx:nginx ${CONFIG.webroot} 2>/dev/null || true`,
    `chmod -R 644 ${CONFIG.webroot}/*`,
    `find ${CONFIG.webroot} -type d -exec chmod 755 {} +`,
    
    // 重启Web服务
    `systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true`,
    
    // 清理临时文件
    `rm -rf ${sourceDir}`
  ];
  
  // 逐个执行命令
  let commandIndex = 0;
  function executeNext() {
    if (commandIndex >= deployCommands.length) {
      log('🎉 代码部署完成');
      return callback(null, '部署成功');
    }
    
    executeCommand(deployCommands[commandIndex], (err) => {
      if (err && commandIndex < 6) { // 前6个命令是关键命令，出错就停止
        return callback(err);
      }
      commandIndex++;
      executeNext();
    });
  }
  
  executeNext();
}

// 健康检查
function healthCheck(callback) {
  const checkCommands = [
    `curl -f -s http://localhost:6500/ > /dev/null`,
    `nginx -t 2>/dev/null`,
    `systemctl is-active nginx 2>/dev/null || service nginx status 2>/dev/null`
  ];
  
  log('🔍 执行健康检查...');
  executeCommand(checkCommands.join(' && '), (err) => {
    if (err) {
      log('❌ 健康检查失败', 'ERROR');
      callback(err);
    } else {
      log('✅ 健康检查通过');
      callback(null, 'OK');
    }
  });
}

// HTTP服务器
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-GitHub-Event, X-Hub-Signature-256');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 路由处理
  if (url.pathname === '/deploy' && req.method === 'POST') {
    handleDeploy(req, res);
  } else if (url.pathname === '/status' && req.method === 'GET') {
    handleStatus(req, res);
  } else if (url.pathname === '/health' && req.method === 'GET') {
    handleHealth(req, res);
  } else if (url.pathname === '/cleanup' && req.method === 'POST') {
    handleCleanup(req, res);
  } else if (url.pathname === '/update' && req.method === 'GET') {
    handleUpdate(req, res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// 处理部署请求
function handleDeploy(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      log('📨 收到部署请求');
      
      // 验证GitHub签名
      const signature = req.headers['x-hub-signature-256'];
      if (!verifyGitHubSignature(body, signature)) {
        log('❌ GitHub签名验证失败', 'ERROR');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }
      
      const payload = JSON.parse(body);
      const commitSha = payload.head_commit?.id || payload.after;
      
      if (!commitSha) {
        log('❌ 无效的提交SHA', 'ERROR');
        res.writeHead(400);
        res.end('Invalid commit SHA');
        return;
      }
      
      log(`🚀 开始部署提交: ${commitSha}`);
      
      // 创建备份
      createBackup((err) => {
        if (err) {
          log(`❌ 备份创建失败: ${err.message}`, 'ERROR');
          res.writeHead(500);
          res.end('Backup failed');
          return;
        }
        
        // 执行部署
        deployFromGitHub(commitSha, (err, result) => {
          if (err) {
            log(`❌ 部署失败: ${err.message}`, 'ERROR');
            res.writeHead(500);
            res.end('Deploy failed');
            return;
          }
          
          // 健康检查
          healthCheck((err) => {
            if (err) {
              log(`⚠️  部署完成但健康检查失败: ${err.message}`, 'WARN');
            } else {
              log('✅ 部署成功完成');
            }
            
            res.writeHead(200);
            res.end(JSON.stringify({
              status: 'success',
              message: '部署完成',
              commit: commitSha,
              timestamp: new Date().toISOString()
            }));
          });
        });
      });
      
    } catch (error) {
      log(`❌ 部署处理错误: ${error.message}`, 'ERROR');
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });
}

// 处理状态查询
function handleStatus(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'running',
    timestamp: new Date().toISOString(),
    config: {
      port: CONFIG.port,
      webroot: CONFIG.webroot
    }
  }));
}

// 处理健康检查
function handleHealth(req, res) {
  healthCheck((err) => {
    if (err) {
      res.writeHead(500);
      res.end('Health check failed');
    } else {
      res.writeHead(200);
      res.end('OK');
    }
  });
}

// 处理清理请求
function handleCleanup(req, res) {
  const cleanupCmd = 'find /tmp -name "deploy-*" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true';
  executeCommand(cleanupCmd, (err) => {
    if (err) {
      log(`清理失败: ${err.message}`, 'WARN');
    } else {
      log('🧹 临时文件清理完成');
    }
    res.writeHead(200);
    res.end('Cleanup completed');
  });
}

// 处理简单更新请求（备用方案）
function handleUpdate(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (token !== 'github-deploy-2025') {
    res.writeHead(401);
    res.end('Unauthorized');
    return;
  }
  
  log('📨 收到简单部署请求');
  
  // 从main分支拉取最新代码
  deployFromGitHub('main', (err) => {
    if (err) {
      res.writeHead(500);
      res.end('Deploy failed');
    } else {
      res.writeHead(200);
      res.end('Deploy completed');
    }
  });
}

// 启动服务器
server.listen(CONFIG.port, () => {
  log(`🚀 GitHub部署接收服务已启动`);
  log(`📡 监听端口: ${CONFIG.port}`);
  log(`🌐 网站根目录: ${CONFIG.webroot}`);
  log(`📝 日志文件: ${CONFIG.logFile}`);
});

// 进程退出处理
process.on('SIGINT', () => {
  log('📝 收到退出信号，正在关闭服务...');
  server.close(() => {
    log('✅ 服务已关闭');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  log(`💥 未捕获异常: ${err.message}`, 'ERROR');
  log(err.stack, 'ERROR');
});