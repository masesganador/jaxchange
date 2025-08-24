const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy client build files to public directory
const clientBuildDir = path.join(__dirname, '../client/build');
const publicBuildDir = path.join(publicDir, 'build');

if (fs.existsSync(clientBuildDir)) {
  // Remove existing build directory in public
  if (fs.existsSync(publicBuildDir)) {
    fs.rmSync(publicBuildDir, { recursive: true, force: true });
  }

  // Copy client build to public
  fs.cpSync(clientBuildDir, publicBuildDir, { recursive: true });
  console.log('✅ Client build files copied to public directory');
} else {
  console.log('⚠️  Client build directory not found, skipping copy');
}

// Create a simple index.html in public if it doesn't exist
const indexHtmlPath = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JAXChange - Jamaican Cryptocurrency Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            color: white;
            max-width: 800px;
            padding: 2rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .feature h3 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .cta {
            margin-top: 3rem;
        }
        .btn {
            display: inline-block;
            padding: 1rem 2rem;
            margin: 0 1rem;
            border: none;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .primary-btn {
            background: #4CAF50;
            color: white;
        }
        .secondary-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid white;
        }
        .api-info {
            margin-top: 3rem;
            padding: 2rem;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        .api-info h3 {
            margin-bottom: 1rem;
        }
        .api-links {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .api-links a {
            color: #4CAF50;
            text-decoration: none;
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.9);
            border-radius: 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🇯🇲 JAXChange</h1>
        <p>Jamaican Cryptocurrency Purchase Platform</p>
        
        <div class="features">
            <div class="feature">
                <h3>🚀 Fast & Secure</h3>
                <p>Buy and sell cryptocurrencies with confidence using our secure platform</p>
            </div>
            <div class="feature">
                <h3>🇯🇲 Jamaican Focused</h3>
                <p>Built specifically for the Jamaican market with local payment methods</p>
            </div>
            <div class="feature">
                <h3>💳 Multiple Payment Methods</h3>
                <p>Support for local payment options and international transfers</p>
            </div>
        </div>
        
        <div class="cta">
            <a href="/api/v1/users/register" class="btn primary-btn">Get Started</a>
            <a href="/api-docs" class="btn secondary-btn">API Documentation</a>
        </div>
        
        <div class="api-info">
            <h3>API Endpoints</h3>
            <div class="api-links">
                <a href="/api">API Root</a>
                <a href="/health">Health Check</a>
                <a href="/api-docs">Swagger Docs</a>
            </div>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('✅ Created index.html in public directory');
}
