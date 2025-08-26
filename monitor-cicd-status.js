#!/usr/bin/env node

/**
 * GitHub CI/CD 状态监控脚本
 * 定时检查GitHub Actions状态和服务器部署状态
 */

const https = require('https');
const http = require('http');
const { exec } = require('child_process');

// 配置
const CONFIG = {
  githubRepo: 'vulgatecnn/www.assaybio.cn.web',
  githubToken: process.env.GITHUB_TOKEN || '', // 如果设置了GitHub token
  serverUrl: 'http://192.3.11.106',
  serverPort: 6500,
  monitorPort: 3000,
  checkInterval: 30000, // 30秒检查一次
  logFile: 'cicd-monitor.log'
};

// 当前状态
let currentStatus = {
  lastCheck: null,
  githubActions: { status: 'unknown', lastRun: null, conclusion: null },
  serverStatus: { status: 'unknown', accessible: false, version: null },
  deployService: { status: 'unknown', accessible: false }
};

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}`;
  console.log(logMessage);
}

// HTTP请求封装
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ statusCode: res.statusCode, data: result, headers: res.headers });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// 检查GitHub Actions状态
async function checkGitHubActions() {
  try {
    log('🔍 检查GitHub Actions状态...');
    
    const url = `https://api.github.com/repos/${CONFIG.githubRepo}/actions/runs?per_page=1`;
    const options = {};
    
    if (CONFIG.githubToken) {
      options.headers = {
        'Authorization': `token ${CONFIG.githubToken}`,
        'User-Agent': 'CICD-Monitor'
      };
    }
    
    const response = await httpRequest(url, options);
    
    if (response.statusCode === 200 && response.data.workflow_runs?.length > 0) {
      const latestRun = response.data.workflow_runs[0];
      currentStatus.githubActions = {
        status: latestRun.status,
        conclusion: latestRun.conclusion,
        lastRun: latestRun.updated_at,
        workflowName: latestRun.name,
        commitSha: latestRun.head_sha?.substring(0, 7),
        commitMessage: latestRun.head_commit?.message?.split('\n')[0]?.substring(0, 50),
        htmlUrl: latestRun.html_url
      };
      
      log(`✅ GitHub Actions: ${latestRun.status} (${latestRun.conclusion || 'running'})`);
      log(`   工作流: ${latestRun.name}`);
      log(`   提交: ${latestRun.head_sha?.substring(0, 7)} - ${latestRun.head_commit?.message?.split('\n')[0]?.substring(0, 50)}`);
      
      return true;
    } else {
      log(`⚠️  GitHub API响应异常: ${response.statusCode}`);
      currentStatus.githubActions.status = 'api_error';
      return false;
    }
    
  } catch (error) {
    log(`❌ GitHub Actions检查失败: ${error.message}`, 'ERROR');
    currentStatus.githubActions.status = 'error';
    return false;
  }
}

// 检查服务器网站状态
async function checkServerStatus() {
  try {
    log('🌐 检查服务器网站状态...');
    
    // 检查主网站
    const websiteUrl = `${CONFIG.serverUrl}:${CONFIG.serverPort}/`;
    const websiteResponse = await httpRequest(websiteUrl);
    
    currentStatus.serverStatus.accessible = websiteResponse.statusCode === 200;
    currentStatus.serverStatus.status = websiteResponse.statusCode === 200 ? 'online' : 'offline';
    
    if (websiteResponse.statusCode === 200) {
      log('✅ 网站可正常访问');
      
      // 尝试获取版本信息
      try {
        const versionUrl = `${CONFIG.serverUrl}:${CONFIG.serverPort}/version.json`;
        const versionResponse = await httpRequest(versionUrl);
        
        if (versionResponse.statusCode === 200 && typeof versionResponse.data === 'object') {
          currentStatus.serverStatus.version = versionResponse.data;
          log(`📊 网站版本: ${versionResponse.data.version?.substring(0, 7) || 'unknown'}`);
          log(`⏰ 部署时间: ${versionResponse.data.deployed_at || 'unknown'}`);
        }
      } catch (versionError) {
        log('⚠️  无法获取版本信息');
      }
      
    } else {
      log(`❌ 网站访问失败: HTTP ${websiteResponse.statusCode}`, 'ERROR');
    }
    
    return websiteResponse.statusCode === 200;
    
  } catch (error) {
    log(`❌ 服务器状态检查失败: ${error.message}`, 'ERROR');
    currentStatus.serverStatus.status = 'error';
    currentStatus.serverStatus.accessible = false;
    return false;
  }
}

// 检查部署服务状态
async function checkDeployService() {
  try {
    log('🤖 检查部署服务状态...');
    
    const deployUrl = `${CONFIG.serverUrl}:${CONFIG.monitorPort}/status`;
    const response = await httpRequest(deployUrl);
    
    if (response.statusCode === 200) {
      currentStatus.deployService = {
        status: 'running',
        accessible: true,
        data: response.data
      };
      log('✅ 部署服务正常运行');
      return true;
    } else {
      log(`⚠️  部署服务响应异常: HTTP ${response.statusCode}`);
      currentStatus.deployService.status = 'offline';
      currentStatus.deployService.accessible = false;
      return false;
    }
    
  } catch (error) {
    log(`❌ 部署服务检查失败: ${error.message}`, 'WARN');
    currentStatus.deployService.status = 'offline';
    currentStatus.deployService.accessible = false;
    return false;
  }
}

// 生成状态报告
function generateStatusReport() {
  const report = {
    timestamp: new Date().toISOString(),
    overall: 'unknown',
    details: currentStatus
  };
  
  // 评估整体状态
  const githubOk = ['completed', 'success'].includes(currentStatus.githubActions.conclusion) || 
                   currentStatus.githubActions.status === 'in_progress';
  const serverOk = currentStatus.serverStatus.accessible;
  const deployOk = currentStatus.deployService.accessible;
  
  if (serverOk && (githubOk || deployOk)) {
    report.overall = 'healthy';
  } else if (serverOk) {
    report.overall = 'partial';
  } else {
    report.overall = 'unhealthy';
  }
  
  return report;
}

// 显示状态摘要
function displayStatusSummary() {
  console.clear();
  console.log('🚀 GitHub CI/CD 状态监控');
  console.log('=' .repeat(50));
  console.log(`🕐 检查时间: ${new Date().toLocaleString()}`);
  console.log('');
  
  // GitHub Actions状态
  const ghStatus = currentStatus.githubActions;
  let ghIcon = '❓';
  if (ghStatus.conclusion === 'success') ghIcon = '✅';
  else if (ghStatus.conclusion === 'failure') ghIcon = '❌';
  else if (ghStatus.status === 'in_progress') ghIcon = '🔄';
  else if (ghStatus.status === 'queued') ghIcon = '⏳';
  
  console.log(`${ghIcon} GitHub Actions:`);
  console.log(`   状态: ${ghStatus.status} ${ghStatus.conclusion ? `(${ghStatus.conclusion})` : ''}`);
  if (ghStatus.workflowName) console.log(`   工作流: ${ghStatus.workflowName}`);
  if (ghStatus.commitSha) console.log(`   提交: ${ghStatus.commitSha} - ${ghStatus.commitMessage || ''}`);
  if (ghStatus.lastRun) console.log(`   时间: ${new Date(ghStatus.lastRun).toLocaleString()}`);
  console.log('');
  
  // 服务器状态
  const serverIcon = currentStatus.serverStatus.accessible ? '✅' : '❌';
  console.log(`${serverIcon} 服务器状态:`);
  console.log(`   网站: ${CONFIG.serverUrl}:${CONFIG.serverPort} (${currentStatus.serverStatus.status})`);
  if (currentStatus.serverStatus.version) {
    console.log(`   版本: ${currentStatus.serverStatus.version.version?.substring(0, 7) || 'unknown'}`);
    console.log(`   部署: ${new Date(currentStatus.serverStatus.version.deployed_at).toLocaleString()}`);
  }
  console.log('');
  
  // 部署服务状态
  const deployIcon = currentStatus.deployService.accessible ? '✅' : '⚠️';
  console.log(`${deployIcon} 部署服务:`);
  console.log(`   状态: ${currentStatus.deployService.status}`);
  console.log(`   地址: ${CONFIG.serverUrl}:${CONFIG.monitorPort}`);
  console.log('');
  
  // 整体状态
  const report = generateStatusReport();
  const overallIcon = report.overall === 'healthy' ? '✅' : 
                     report.overall === 'partial' ? '⚠️' : '❌';
  console.log(`${overallIcon} 整体状态: ${report.overall.toUpperCase()}`);
  console.log('');
  console.log(`⏱️  下次检查: ${Math.floor(CONFIG.checkInterval / 1000)}秒后`);
  console.log('按 Ctrl+C 停止监控');
}

// 执行完整检查
async function performFullCheck() {
  currentStatus.lastCheck = new Date().toISOString();
  
  const checks = await Promise.allSettled([
    checkGitHubActions(),
    checkServerStatus(),
    checkDeployService()
  ]);
  
  displayStatusSummary();
  
  // 记录检查结果
  const report = generateStatusReport();
  log(`📊 检查完成 - 整体状态: ${report.overall}`);
  
  return report;
}

// 主函数
async function main() {
  log('🚀 启动GitHub CI/CD状态监控...');
  log(`📂 仓库: ${CONFIG.githubRepo}`);
  log(`🌐 服务器: ${CONFIG.serverUrl}:${CONFIG.serverPort}`);
  log(`⏱️  检查间隔: ${CONFIG.checkInterval / 1000}秒`);
  
  // 立即执行一次检查
  await performFullCheck();
  
  // 设置定时检查
  const interval = setInterval(async () => {
    try {
      await performFullCheck();
    } catch (error) {
      log(`❌ 检查过程中出错: ${error.message}`, 'ERROR');
    }
  }, CONFIG.checkInterval);
  
  // 处理退出信号
  process.on('SIGINT', () => {
    log('📝 收到退出信号，停止监控...');
    clearInterval(interval);
    console.log('\n👋 监控已停止');
    process.exit(0);
  });
  
  log('✅ 监控服务已启动，按 Ctrl+C 停止');
}

// 启动监控
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  });
}

module.exports = { performFullCheck, generateStatusReport };