const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const PUBLIC_LOGO_REGEX = /<span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨<\/span>\s*<span>ZZZ HOTEL<\/span>/g;
const DASH_LOGO_REGEX = /<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[a-z0-9-]+ text-white shadow-lg shadow-[a-z0-9-\/]+">\s*<[A-Za-z0-9]+ className="w-6 h-6" \/>\s*<\/div>\s*<div>\s*<span className="text-xl font-black text-(?:slate-800|white) tracking-tight block leading-tight">zzz-hotel<\/span>/g;

let updatedFiles = 0;

walkDir('./app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    if (PUBLIC_LOGO_REGEX.test(content)) {
      content = content.replace(PUBLIC_LOGO_REGEX, '<img src="/Zzz.svg" alt="ZZZ Hotel Logo" className="h-8 w-auto" />');
      hasChanges = true;
    }
    
    if (DASH_LOGO_REGEX.test(content)) {
      content = content.replace(DASH_LOGO_REGEX, '<img src="/Zzz.svg" alt="ZZZ Hotel Logo" className="h-10 w-auto" />\n            <div>');
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
      updatedFiles++;
    }
  }
});

console.log(`Updated ${updatedFiles} files.`);
