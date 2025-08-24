const fs = require('fs');
const path = require('path');

function copyAssets() {
  try {
    console.log('📁 Copying assets...');
    
    // Copy migration files
    const sourceDir = path.join(__dirname, '..', 'src', 'shared', 'database', 'migrations');
    const targetDir = path.join(__dirname, '..', 'dist', 'shared', 'database', 'migrations');
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(path.dirname(targetDir))) {
      fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    }
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy migration files
    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir);
      
      files.forEach(file => {
        if (file.endsWith('.sql')) {
          const sourcePath = path.join(sourceDir, file);
          const targetPath = path.join(targetDir, file);
          
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`✅ Copied: ${file}`);
        }
      });
      
      console.log(`🎉 Successfully copied ${files.filter(f => f.endsWith('.sql')).length} migration files`);
    } else {
      console.log('⚠️  Source migrations directory not found');
    }
    
  } catch (error) {
    console.error('❌ Error copying assets:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  copyAssets();
}

module.exports = { copyAssets };
