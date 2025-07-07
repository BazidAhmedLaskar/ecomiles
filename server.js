const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Middleware to inject Firebase config into HTML pages
app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/') {
        const filePath = req.path === '/' ? 'index.html' : req.path.substring(1);
        
        fs.readFile(path.join(__dirname, filePath), 'utf8', (err, data) => {
            if (err) {
                return next();
            }
            
            // Inject Firebase config before the closing head tag
            const configScript = `
                <script>
                    window.FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig)};
                </script>
            `;
            
            const modifiedHtml = data.replace('</head>', `    ${configScript}\n</head>`);
            
            res.type('html').send(modifiedHtml);
        });
    } else {
        next();
    }
});

// Serve static files
app.use(express.static(__dirname));

// Handle 404s by serving 404.html
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 EcoMiles server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
    
    if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
        console.log('✅ Firebase configuration loaded successfully');
    } else {
        console.log('⚠️  Firebase configuration incomplete - check environment variables');
    }
});