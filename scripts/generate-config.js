const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, '..', 'public', 'config.json');

const cfg = {
    API_URL: process.env.API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(cfg, null, 2), 'utf8');
console.log('Generated config at', outPath, cfg);
