'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
process.chdir(path.join(__dirname, '..'));
const files = ['.gitignore','.nvmrc','README.md','PRODUCT.md','ROADMAP.md','ARCHITECTURE.md','STATUS.md','NOTICE.md','package.json','package-lock.json','build.cjs','math-renderer.cjs','math-compat.cjs','math-compat.test.cjs','legacy-math-adapter.cjs','semantic-units.cjs','semantic-units-test.cjs','header-format.cjs','test.cjs','reader.css','anchor.js','toc.js','header-scroll.js','copy-math.js','header-scroll-test.cjs','settings.js','settings-test.cjs','settings.html','index.html','scripts/manifest.cjs'];
function walk(dir) { for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {const name = `${dir}/${entry.name}`; if(entry.isSymbolicLink()) throw new Error(`No symlinks allowed: ${name}`); if(entry.isDirectory()) walk(name); else files.push(name); } }
walk('sources'); walk('docs');
const entries = files.sort().map(file => {const bytes = fs.readFileSync(file);return {path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),encoding:/\.(woff2|png|jpe?g)$/.test(file)?'base64':'utf-8'};});
if (entries.some(e=> /node_modules|\.git\/|\.openai|screenshots|browser-qa|\.log$|\/\.env/.test(e.path))) throw new Error('Excluded material in manifest');
const manifest = {format:1,siteDirectory:'docs',files:entries,totalFiles:entries.length,totalBytes:entries.reduce((n,e)=>n+e.bytes,0)};
fs.writeFileSync('upload-manifest.json', JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({manifest:'upload-manifest.json',files:manifest.totalFiles,bytes:manifest.totalBytes},null,2));
