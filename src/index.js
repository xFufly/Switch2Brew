const path = require('path');
const fs = require('fs');

require("./dns");
require("./server");

// Start apps scripts (require all apps that have nodeScripts defined)

const APPS_ROOT = path.join(__dirname, '..', 'apps');

function startAppScripts() {
    if (!fs.existsSync(APPS_ROOT)) return;
    const entries = fs.readdirSync(APPS_ROOT, { withFileTypes: true });
    for (const e of entries) {
        if (!e.isDirectory()) continue;
        const id = e.name;
        try {
            const appJsonPath = path.join(APPS_ROOT, id, 'app.json');
            if (!fs.existsSync(appJsonPath)) continue;
            const raw = fs.readFileSync(appJsonPath, 'utf8');
            const meta = JSON.parse(raw);
            if (Array.isArray(meta.nodeScripts)) {
                for (const scriptRelPath of meta.nodeScripts) {
                    const scriptPath = path.join(APPS_ROOT, id, scriptRelPath);
                    if (fs.existsSync(scriptPath)){
                        console.log(`✓ Starting app "${id}" node script: ${scriptRelPath}`);
                        require(scriptPath);
                    } else {
                        console.warn(`✗ App "${id}" node script not found: ${scriptRelPath}`);
                    }
                }
            }
        } catch(err) {
            console.warn('Failed to start app scripts for', id, err.message);
        }
    }
}

startAppScripts();