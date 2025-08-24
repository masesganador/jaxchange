import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create supported cryptocurrencies
  const cryptocurrencies = [
    {
      id: 'BTC',
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
      isActive: true,
      minPurchaseAmount: 10.00,
      maxPurchaseAmount: 25000.00,
      iconUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
      description: 'The first and most well-known cryptocurrency',
      blockchainNetwork: 'Bitcoin',
      contractAddress: null
    },
    {
      id: 'ETH',
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      isActive: true,
      minPurchaseAmount: 10.00,
      maxPurchaseAmount: 25000.00,
      iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      description: 'A decentralized platform for smart contracts',
      blockchainNetwork: 'Ethereum',
      contractAddress: null
    },
    {
      id: 'USDT',
      name: 'Tether',
      symbol: 'USDT',
      decimals: 6,
      isActive: true,
      minPurchaseAmount: 10.00,
      maxPurchaseAmount: 25000.00,
      iconUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
      description: 'A stablecoin pegged to the US Dollar',
      blockchainNetwork: 'Ethereum',
      contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    }
  ];

  for (const crypto of cryptocurrencies) {
    await prisma.supportedCryptocurrency.upsert({
      where: { id: crypto.id },
      update: crypto,
      create: crypto
    });
  }

  // Create exchanges
  const exchanges = [
    {
      id: 'binance',
      name: 'Binance',
      apiEndpoint: 'https://api.binance.com',
      status: 'ACTIVE' as const,
      supportedPairs: ['BTC/USDT', 'ETH/USDT', 'BTC/USD', 'ETH/USD'],
      tradingFees: 0.001,
      withdrawalFees: {
        BTC: 0.0005,
        ETH: 0.005,
        USDT: 1
      },
      minTradeAmounts: {
        BTC: 0.0001,
        ETH: 0.001,
        USDT: 10
      },
      maxTradeAmounts: {
        BTC: 100,
        ETH: 1000,
        USDT: 1000000
      },
      priority: 1
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      apiEndpoint: 'https://api.coinbase.com',
      status: 'ACTIVE' as const,
      supportedPairs: ['BTC/USD', 'ETH/USD', 'BTC/USDT', 'ETH/USDT'],
      tradingFees: 0.005,
      withdrawalFees: {
        BTC: 0.0001,
        ETH: 0.001,
        USDT: 0.5
      },
      minTradeAmounts: {
        BTC: 0.0001,
        ETH: 0.001,
        USDT: 1
      },
      maxTradeAmounts: {
        BTC: 50,
        ETH: 500,
        USDT: 500000
      },
      priority: 2
    }
  ];

  for (const exchange of exchanges) {
    await prisma.exchange.upsert({
      where: { id: exchange.id },
      update: exchange,
      create: exchange
    });
  }

  // Create sample user with hashed password
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const sampleUser = await prisma.user.upsert({
    where: { email: 'admin@jaxchange.com' },
    update: {},
    create: {
      email: 'admin@jaxchange.com',
      phone: '+18761234567',
      passwordHash: hashedPassword,
      status: 'ACTIVE',
      referralCode: 'ADMIN001',
      emailVerified: true,
      phoneVerified: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          country: 'JAM',
          occupation: 'System Administrator'
        }
      },
      verification: {
        create: {
          kycStatus: 'APPROVED',
          verificationLevel: 3
        }
      },
      preferences: {
        create: {
          notificationEmail: true,
          notificationSms: true,
          notificationPush: true,
          tradingLimitDaily: 1000.00,
          tradingLimitMonthly: 5000.00,
          twoFactorEnabled: false,
          preferredCurrency: 'USD'
        }
      }
    }
  });

  // Create sample market prices
  const marketPrices = [
    {
      symbol: 'BTC',
      baseSymbol: 'USDT',
      exchangeId: 'binance',
      bidPrice: 45000.00,
      askPrice: 45100.00,
      lastPrice: 45050.00,
      volume24h: 1000.5,
      change24h: 2.5
    },
    {
      symbol: 'ETH',
      baseSymbol: 'USDT',
      exchangeId: 'binance',
      bidPrice: 3200.00,
      askPrice: 3210.00,
      lastPrice: 3205.00,
      volume24h: 5000.2,
      change24h: 1.8
    },
    {
      symbol: 'BTC',
      baseSymbol: 'USD',
      exchangeId: 'coinbase',
      bidPrice: 44950.00,
      askPrice: 45050.00,
      lastPrice: 45000.00,
      volume24h: 800.3,
      change24h: 2.2
    }
  ];

  for (const price of marketPrices) {
    await prisma.marketPrice.upsert({
      where: {
        symbol_baseSymbol_exchangeId: {
          symbol: price.symbol,
          baseSymbol: price.baseSymbol,
          exchangeId: price.exchangeId
        }
      },
      update: price,
      create: price
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`📧 Sample admin user created: admin@jaxchange.com (password: password123)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
