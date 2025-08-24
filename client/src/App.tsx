import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🇯🇲 JAXChange</h1>
        <p>Jamaican Cryptocurrency Purchase Platform</p>
        
        <div className="features">
          <div className="feature">
            <h3>🚀 Fast & Secure</h3>
            <p>Buy and sell cryptocurrencies with confidence using our secure platform</p>
          </div>
          <div className="feature">
            <h3>🇯🇲 Jamaican Focused</h3>
            <p>Built specifically for the Jamaican market with local payment methods</p>
          </div>
          <div className="feature">
            <h3>💳 Multiple Payment Methods</h3>
            <p>Support for local payment options and international transfers</p>
          </div>
        </div>
        
        <div className="cta">
          <a href="/api/v1/users/register" className="btn primary-btn">Get Started</a>
          <a href="/api-docs" className="btn secondary-btn">API Documentation</a>
        </div>
        
        <div className="api-info">
          <h3>API Endpoints</h3>
          <div className="api-links">
            <a href="/api">API Root</a>
            <a href="/health">Health Check</a>
            <a href="/api-docs">Swagger Docs</a>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
