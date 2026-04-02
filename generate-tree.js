import fs from 'fs';
import path from 'path';

function generateTree(dir, prefix = '', ignorePaths = ['.git', 'node_modules', 'dist']) {
  let output = '';
  const dirName = path.basename(dir);
  
  const items = fs.readdirSync(dir).filter(item => !ignorePaths.includes(item));
  
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      output += `${prefix}${isLast ? '└── ' : '├── '}${item}/\n`;
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      output += generateTree(itemPath, nextPrefix, ignorePaths);
    } else {
      output += `${prefix}${isLast ? '└── ' : '├── '}${item}\n`;
    }
  });
  
  return output;
}

const tree = `Agenix/\n${generateTree(process.cwd())}`;
fs.writeFileSync('tree.txt', tree);
