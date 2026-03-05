#!/usr/bin/env node

/**
 * 测试运行器 - 运行所有单元测试
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  'test-state-analyzer.js',
  'test-dedup-manager.js'
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`运行测试: ${testFile}`);
    console.log('='.repeat(60));

    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`测试失败: ${testFile} (退出码: ${code})`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('Claude Notifications - 单元测试套件');
  console.log('====================================\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTest(test);
      passed++;
    } catch (error) {
      console.error(`\n❌ ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📊 总计: ${passed + failed}`);

  if (failed > 0) {
    console.log('\n❌ 部分测试失败');
    process.exit(1);
  } else {
    console.log('\n✅ 所有测试通过！');
    process.exit(0);
  }
}

runAllTests().catch(error => {
  console.error('测试运行器错误:', error);
  process.exit(1);
});
