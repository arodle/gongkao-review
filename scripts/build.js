const fs = require('fs-extra');
const { execSync } = require('child_process');

console.log('Starting build...');

try {
  // 运行 Next.js 构建
  execSync('pnpm run build', { stdio: 'inherit' });
  
  // 检查是否存在符号链接问题
  const staticDir = '.next/static';
  const tempDir = '.next/static-temp';
  
  if (fs.existsSync(staticDir)) {
    console.log('Copying static files (dereferencing symlinks)...');
    // 使用 dereference: true 复制文件而不是符号链接
    fs.copySync(staticDir, tempDir, { dereference: true });
    // 删除原目录
    fs.removeSync(staticDir);
    // 重命名临时目录
    fs.renameSync(tempDir, staticDir);
    console.log('Static files copied successfully');
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}