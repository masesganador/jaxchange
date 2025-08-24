const fs = require('fs');
const path = require('path');

// Create client public directory if it doesn't exist
const clientPublicDir = path.join(__dirname, '../client/public');
if (!fs.existsSync(clientPublicDir)) {
  fs.mkdirSync(clientPublicDir, { recursive: true });
}

// Create index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="JAXChange - Jamaican Cryptocurrency Purchase Platform"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>JAXChange - Cryptocurrency Platform</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

fs.writeFileSync(path.join(clientPublicDir, 'index.html'), indexHtml);

// Create manifest.json
const manifestJson = {
  "short_name": "JAXChange",
  "name": "JAXChange - Jamaican Cryptocurrency Platform",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
};

fs.writeFileSync(path.join(clientPublicDir, 'manifest.json'), JSON.stringify(manifestJson, null, 2));

// Create robots.txt
const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:`;

fs.writeFileSync(path.join(clientPublicDir, 'robots.txt'), robotsTxt);

console.log('✅ Client public directory setup complete');
