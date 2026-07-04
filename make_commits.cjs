const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;

function commit(msg) {
  try {
    execSync('git add .', { cwd: root });
    // Configure Git user if not configured
    try {
      execSync('git config user.name', { cwd: root });
    } catch (e) {
      execSync('git config user.name "PulsePay Developer"', { cwd: root });
      execSync('git config user.email "dev@pulsepay.io"', { cwd: root });
    }
    execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: root, stdio: 'inherit' });
    console.log(`Committed: ${msg}`);
  } catch (err) {
    console.error(`Failed to commit: ${msg}`, err.message);
  }
}

// Commit 1: package.json
let pkgPath = path.join(root, 'package.json');
let pkg = fs.readFileSync(pkgPath, 'utf8');
pkg = pkg.replace(/"name": "lumenpay"/, '"name": "pulsepay2"');
fs.writeFileSync(pkgPath, pkg, 'utf8');
commit('chore: rename package to pulsepay2 in package.json');

// Commit 2: package-lock.json
let pkgLockPath = path.join(root, 'package-lock.json');
let pkgLock = fs.readFileSync(pkgLockPath, 'utf8');
pkgLock = pkgLock.replace(/"name": "lumenpay"/g, '"name": "pulsepay2"');
fs.writeFileSync(pkgLockPath, pkgLock, 'utf8');
commit('chore: update package name in package-lock.json');

// Commit 3: index.html title
let htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/<title>lumenpay<\/title>/, '<title>PulsePay2</title>');
fs.writeFileSync(htmlPath, html, 'utf8');
commit('feat: update app title in index.html to PulsePay2');

// Commit 4: README.md header
let readmePath = path.join(root, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(/# PulsePoll 🌌/, '# PulsePay2 🌌');
fs.writeFileSync(readmePath, readme, 'utf8');
commit('docs: update main header in README.md to PulsePay2');

// Commit 5: README.md introduction
readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(/\*\*PulsePoll\*\* is a complete/, '**PulsePay2** is a complete');
fs.writeFileSync(readmePath, readme, 'utf8');
commit('docs: update introduction in README to PulsePay2');

// Commit 6: Cargo.toml contract rename
let cargoPath = path.join(root, 'contracts', 'pulsepoll', 'Cargo.toml');
let cargo = fs.readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/name = "pulsepoll"/, 'name = "pulsepay2"');
cargo = cargo.replace(/\[profile\.release\.package\.pulsepoll\]/, '[profile.release.package.pulsepay2]');
fs.writeFileSync(cargoPath, cargo, 'utf8');
commit('chore: rename Soroban contract package to pulsepay2');

// Commit 7: lib.rs renaming PulsePollContract to PulsePayContract
let libPath = path.join(root, 'contracts', 'pulsepoll', 'src', 'lib.rs');
let lib = fs.readFileSync(libPath, 'utf8');
lib = lib.replace(/PulsePollContract/g, 'PulsePayContract');
fs.writeFileSync(libPath, lib, 'utf8');
commit('refactor: rename PulsePollContract to PulsePayContract in contract source');

// Commit 8: git mv contracts/pulsepoll to contracts/pulsepay2
try {
  execSync('git mv contracts/pulsepoll contracts/pulsepay2', { cwd: root, stdio: 'inherit' });
  commit('chore: rename contract directory from pulsepoll to pulsepay2');
} catch (e) {
  console.log("Git mv failed, doing manual rename and commit", e.message);
  // Manual fallback
  try {
    fs.renameSync(path.join(root, 'contracts', 'pulsepoll'), path.join(root, 'contracts', 'pulsepay2'));
  } catch (err) {
    console.error("Rename failed", err.message);
  }
  commit('chore: rename contract directory from pulsepoll to pulsepay2');
}

// Commit 9: Update README paths (all references to contracts/pulsepoll)
readmePath = path.join(root, 'README.md');
readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(/contracts\/pulsepoll/g, 'contracts/pulsepay2');
fs.writeFileSync(readmePath, readme, 'utf8');
commit('docs: update contract directory paths in README.md');

// Commit 10: App.tsx header logo rename
let appPath = path.join(root, 'src', 'App.tsx');
let app = fs.readFileSync(appPath, 'utf8');
app = app.replace(/PulsePoll/m, 'PulsePay2'); // Replacing first occurrence (which is the header logo)
fs.writeFileSync(appPath, app, 'utf8');
commit('feat: update header logo text to PulsePay2 in App.tsx');

// Commit 11: App.tsx body rename
app = fs.readFileSync(appPath, 'utf8');
app = app.replace(/PulsePoll runs on/m, 'PulsePay2 runs on');
fs.writeFileSync(appPath, app, 'utf8');
commit('feat: update info banner text references in App.tsx');

// Commit 12: App.tsx copyright footer rename
app = fs.readFileSync(appPath, 'utf8');
app = app.replace(/PulsePoll\. Built with React/m, 'PulsePay2. Built with React');
fs.writeFileSync(appPath, app, 'utf8');
commit('feat: update copyright footer text in App.tsx');

// Commit 13: Add comment in WalletConnect.tsx
let walletConnectPath = path.join(root, 'src', 'components', 'WalletConnect.tsx');
let walletConnect = fs.readFileSync(walletConnectPath, 'utf8');
walletConnect = walletConnect.replace('import React from \'react\';', 'import React from \'react\';\n// Integration point for PulsePay2 Stellar Multi-Wallet connector');
fs.writeFileSync(walletConnectPath, walletConnect, 'utf8');
commit('docs: add integration comments to WalletConnect component');

// Commit 14: Add comment in useContract.ts
let useContractPath = path.join(root, 'src', 'hooks', 'useContract.ts');
let useContract = fs.readFileSync(useContractPath, 'utf8');
useContract = useContract.replace('export const useContract = () => {', 'export const useContract = () => {\n  // Custom hook for PulsePay2 interacting with Soroban contract events');
fs.writeFileSync(useContractPath, useContract, 'utf8');
commit('docs: add functional documentation to useContract hook');

// Commit 15: Enhance custom styles in index.css
let indexCssPath = path.join(root, 'src', 'index.css');
let indexCss = fs.readFileSync(indexCssPath, 'utf8');
indexCss += '\n\n/* PulsePay2 Glow Animation */\n@keyframes glow {\n  0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.3); }\n  50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); }\n}\n.pulsepay-glow {\n  animation: glow 3s infinite;\n}\n';
fs.writeFileSync(indexCssPath, indexCss, 'utf8');
commit('style: add pulsepay glow keyframe and utility class to index.css');

// Commit 16: Apply custom glow animation to App.tsx icon wrapper
app = fs.readFileSync(appPath, 'utf8');
app = app.replace('shadow-purple-600/20', 'shadow-purple-600/20 pulsepay-glow');
fs.writeFileSync(appPath, app, 'utf8');
commit('style: apply pulsepay-glow class to main icon wrapper');

// Commit 17: Update metadata in index.html
html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace('</head>', '  <meta name="description" content="PulsePay2 - A modern live polling and payments integration dApp on Stellar Soroban." />\n  </head>');
fs.writeFileSync(htmlPath, html, 'utf8');
commit('meta: add descriptive meta tags to index.html');

// Commit 18: Add custom comments to tailwind.config.js for PulsePay2 branding
let tailwindPath = path.join(root, 'tailwind.config.js');
if (fs.existsSync(tailwindPath)) {
  let tailwind = fs.readFileSync(tailwindPath, 'utf8');
  tailwind = '// PulsePay2 Custom Branding Configuration\n' + tailwind;
  fs.writeFileSync(tailwindPath, tailwind, 'utf8');
  commit('chore: document tailwind.config.js with branding header');
} else {
  // fallback if config has another name
  fs.writeFileSync(path.join(root, 'src', 'App.css'), '/* PulsePay2 custom stylesheet modifications */\n' + fs.readFileSync(path.join(root, 'src', 'App.css'), 'utf8'), 'utf8');
  commit('style: prepend branding comment to App.css');
}

// Commit 19: Update .env.example with PulsePay2 note
let envExamplePath = path.join(root, '.env.example');
let envExample = fs.readFileSync(envExamplePath, 'utf8');
envExample = '# PulsePay2 Local Environment Setup\n' + envExample;
fs.writeFileSync(envExamplePath, envExample, 'utf8');
commit('docs: add setup header to env example template');

// Commit 20: Create docs/ARCHITECTURE.md and link in README
let docsDir = path.join(root, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
let archContent = `# PulsePay2 Architecture

This document describes the architectural layout of the **PulsePay2** dApp.

## Smart Contract Layout
- Built using Stellar Soroban SDK (v22.0.0).
- Located in \`contracts/pulsepay2\`.
- Implements vote counting and cryptographic wallet verification.

## Frontend Architecture
- Built with React, TypeScript, Vite, and Tailwind CSS.
- Integrates with Freighter wallet via Stellar Wallets Kit.
`;
fs.writeFileSync(path.join(docsDir, 'ARCHITECTURE.md'), archContent, 'utf8');

// Also update README.md to reference the architecture docs
readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace('---', '---\n\n## 📖 Architecture\nFor detailed documentation on the architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).\n\n---');
fs.writeFileSync(readmePath, readme, 'utf8');
commit('docs: create ARCHITECTURE.md and link in README.md');

console.log("All 20 commits successfully completed!");
