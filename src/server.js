// Web server using express

const express = require('express');
const path = require('path');

const app = express();
const PORT = 80;

// Parse JSON bodies for API endpoints
app.use(express.json({ limit: '64kb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Discover installed apps from the apps/ folder
const fs = require('fs');
const APPS_ROOT = path.join(__dirname, '..', 'apps');

function discoverApps(){
    const entries = fs.readdirSync(APPS_ROOT, { withFileTypes: true });
    const apps = [];
    for (const e of entries){
        if (!e.isDirectory()) continue;
        const id = e.name;
        try{
            const appJsonPath = path.join(APPS_ROOT, id, 'app.json');
            if (!fs.existsSync(appJsonPath)) continue;
            const raw = fs.readFileSync(appJsonPath, 'utf8');
            const meta = JSON.parse(raw);
            const iconPath = `/apps/${id}/icon.png`;
            const launchPath = meta.path || '';
            apps.push({ id, name: meta.name || id, author: meta.author || '', version: meta.version || '', description: meta.description || '', icon: iconPath, path: launchPath });
        }catch(err){
            console.warn('Failed to read app', id, err.message);
        }
    }
    return apps;
}

function discoverShopApps(){
    const apps = JSON.parse(fs.readFileSync(path.join(__dirname, "../system/apps/beeshop/apps.json"), "utf-8"));
    const entries = fs.readdirSync(APPS_ROOT);
    apps.forEach(app => {
        app.installed = entries.includes(app.id);
        app.icon = `/system/apps/beeshop/icons/${app.id}.png`; 
    });
    return apps;
}

// Serve each app's public folder under /apps/<id>/public
if (fs.existsSync(APPS_ROOT)){
    const sub = fs.readdirSync(APPS_ROOT, { withFileTypes: true });
    for (const e of sub){
        if (!e.isDirectory()) continue;
        const id = e.name;
        const publicDir = path.join(APPS_ROOT, id, 'public');
        if (fs.existsSync(publicDir)){
            // serve the app's public folder at /apps/<id>/ so requests to /apps/<id>/<path> work
            app.use(`/apps/${id}`, express.static(publicDir));
        }
    }
}

// Setup EJS view engine and views location
app.set('views', path.join(__dirname, '../system/apps'));
app.set('view engine', 'ejs');

// Simple home route that renders the home app view
app.get('/', (req, res) => {
    const apps = discoverApps();
    res.render('home/index', { apps });
});

// Simple route that renders the shop app view
app.get('/shop/', (req, res) => {
    const apps = discoverShopApps();
    res.render('beeshop/pages/index', { apps });
});

// API to fetch app info by id or name
app.get('/api/app-info', (req, res) => {
    const idOrName = (req.query.id || req.query.name || '').toString();
    const apps = discoverApps();
    const found = apps.find(a => a.id === idOrName || a.name === idOrName) || null;
    if (found){
        return res.json({ id: found.id, name: found.name, author: found.author, version: found.version, icon: found.icon, description: found.description || '' });
    }
    return res.json({ id: idOrName || null, name: idOrName || 'Unknown', author: 'Unknown', version: 'n/a', icon: '', description: '' });
});

// Accept client-side logs (console messages, errors) for debugging
app.post('/api/client-log', (req, res) => {
    try {
        const { level = 'log', message = '', appId = null, meta = {} } = req.body || {};
        const ts = new Date().toISOString();
        const prefix = appId ? `[client:${appId}]` : '[client]';
        if (level === 'error' || level === 'exception') {
            console.error(`${ts} ${prefix} ERROR:`, message, meta);
        } else if (level === 'warn') {
            console.warn(`${ts} ${prefix} WARN:`, message, meta);
        } else {
            console.log(`${ts} ${prefix} LOG:`, message, meta);
        }
        return res.json({ ok: true });
    } catch (e) {
        console.error('Failed to handle client log', e);
        return res.status(500).json({ ok: false });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✓ Web server running on http://localhost:${PORT}`);
});