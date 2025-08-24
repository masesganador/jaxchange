import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>JAXChange</h1>
        <p>Jamaican Cryptocurrency Purchase Platform</p>
        <div className="features">
          <div className="feature">
            <h3>🚀 Fast & Secure</h3>
            <p>Buy and sell cryptocurrencies with confidence</p>
          </div>
          <div className="feature">
            <h3>🇯🇲 Jamaican Focused</h3>
            <p>Built specifically for the Jamaican market</p>
          </div>
          <div className="feature">
            <h3>💳 Multiple Payment Methods</h3>
            <p>Support for local payment options</p>
          </div>
        </div>
        <div className="cta">
          <button className="primary-btn">Get Started</button>
          <button className="secondary-btn">Learn More</button>
        </div>
      </header>
    </div>
  );
}

export default App;
