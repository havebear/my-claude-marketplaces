#!/usr/bin/env node

/**
 * 依赖检查工具
 * 检查必需的 npm 依赖是否已安装
 */

const fs = require('fs');
const path = require('path');

function checkDependencies() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');
  const nodeModulesPath = path.join(pluginRoot, 'node_modules');

  // 检查 node_modules 是否存在
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ 错误：依赖未安装');
    console.error('');
    console.error('Claude Notifications 插件需要安装 npm 依赖才能工作。');
    console.error('');
    console.error('请运行以下命令安装依赖：');
    console.error('');
    console.error('  方式 1: 使用初始化命令（推荐）');
    console.error('    /notifications-init');
    console.error('');
    console.error('  方式 2: 手动安装');
    console.error(`    cd "${pluginRoot}"`);
    console.error('    npm install');
    console.error('');
    return false;
  }

  // 检查关键依赖
  const requiredDeps = ['node-notifier', 'sound-play'];
  const missingDeps = [];

  for (const dep of requiredDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      missingDeps.push(dep);
    }
  }

  if (missingDeps.length > 0) {
    console.error('❌ 错误：缺少依赖包');
    console.error('');
    console.error('缺少以下依赖：');
    missingDeps.forEach(dep => console.error(`  - ${dep}`));
    console.error('');
    console.error('请运行以下命令重新安装依赖：');
    console.error(`  cd "${pluginRoot}"`);
    console.error('  npm install');
    console.error('');
    return false;
  }

  return true;
}

module.exports = checkDependencies;

// 如果直接运行此脚本
if (require.main === module) {
  if (checkDependencies()) {
    console.log('✅ 所有依赖已正确安装');
  } else {
    process.exit(1);
  }
}
