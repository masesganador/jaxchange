// Example unit test
import config from '@/config';

describe('Configuration', () => {
  it('should load default configuration values', () => {
    expect(config.server.port).toBeDefined();
    expect(config.server.nodeEnv).toBeDefined();
    expect(config.database.host).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
  });

  it('should have valid platform settings', () => {
    expect(config.platform.feePercentage).toBeGreaterThan(0);
    expect(config.platform.minTransactionAmount).toBeGreaterThan(0);
    expect(config.platform.maxTransactionAmount).toBeGreaterThan(config.platform.minTransactionAmount);
    expect(config.platform.supportedCryptocurrencies).toContain('BTC');
    expect(config.platform.supportedCryptocurrencies).toContain('ETH');
  });

  it('should have security settings configured', () => {
    expect(config.security.bcryptRounds).toBeGreaterThanOrEqual(10);
    expect(config.security.rateLimitWindow).toBeGreaterThan(0);
    expect(config.security.rateLimitMax).toBeGreaterThan(0);
  });
});