import { calculateNewPrice, generateVolatility, PriceHistory } from '@/lib/minigame/price-engine';

describe('Price Engine', () => {
  describe('generateVolatility', () => {
    it('should generate volatility within expected range', () => {
      // Run multiple times to test randomness
      for (let i = 0; i < 100; i++) {
        const volatility = generateVolatility();

        // Expected range: -4% to +7%
        expect(volatility).toBeGreaterThanOrEqual(-0.04);
        expect(volatility).toBeLessThanOrEqual(0.07);
      }
    });

    it('should generate different values on consecutive calls', () => {
      const values = new Set();

      for (let i = 0; i < 10; i++) {
        values.add(generateVolatility());
      }

      // Should have at least 8 different values out of 10
      expect(values.size).toBeGreaterThanOrEqual(8);
    });

    it('should average close to expected mean over many iterations', () => {
      const iterations = 10000;
      let sum = 0;

      for (let i = 0; i < iterations; i++) {
        sum += generateVolatility();
      }

      const average = sum / iterations;

      // Expected mean is around 1.5% (halfway between -4% and +7%)
      expect(average).toBeGreaterThan(0.01);
      expect(average).toBeLessThan(0.02);
    });
  });

  describe('calculateNewPrice', () => {
    it('should apply positive volatility correctly', () => {
      const currentPrice = 100;
      const volatility = 0.05; // 5% increase

      const newPrice = calculateNewPrice(currentPrice, volatility);

      expect(newPrice).toBe(105);
    });

    it('should apply negative volatility correctly', () => {
      const currentPrice = 100;
      const volatility = -0.03; // 3% decrease

      const newPrice = calculateNewPrice(currentPrice, volatility);

      expect(newPrice).toBe(97);
    });

    it('should never go below minimum price', () => {
      const currentPrice = 0.001;
      const volatility = -0.99; // 99% decrease

      const newPrice = calculateNewPrice(currentPrice, volatility);

      expect(newPrice).toBeGreaterThanOrEqual(0.0001);
    });

    it('should round to 4 decimal places', () => {
      const currentPrice = 100.123456;
      const volatility = 0.0123456;

      const newPrice = calculateNewPrice(currentPrice, volatility);

      const decimalPlaces = (newPrice.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(4);
    });
  });

  describe('PriceHistory', () => {
    it('should track price changes over time', () => {
      const history = new PriceHistory(100);

      history.addPrice(105, true);
      history.addPrice(103, false);
      history.addPrice(108, true);

      const points = history.getHistory();

      expect(points).toHaveLength(3);
      expect(points[0].price).toBe(105);
      expect(points[0].held).toBe(true);
      expect(points[1].price).toBe(103);
      expect(points[1].held).toBe(false);
      expect(points[2].price).toBe(108);
      expect(points[2].held).toBe(true);
    });

    it('should limit history to 20 points', () => {
      const history = new PriceHistory(100);

      for (let i = 0; i < 30; i++) {
        history.addPrice(100 + i, true);
      }

      const points = history.getHistory();

      expect(points).toHaveLength(20);
      // Should keep the most recent 20
      expect(points[0].price).toBe(110);
      expect(points[19].price).toBe(129);
    });

    it('should calculate statistics correctly', () => {
      const history = new PriceHistory(100);

      history.addPrice(90, false);
      history.addPrice(110, true);
      history.addPrice(100, true);
      history.addPrice(120, false);

      const stats = history.getStatistics();

      expect(stats.highestPrice).toBe(120);
      expect(stats.lowestPrice).toBe(90);
      expect(stats.totalHolds).toBe(2);
      expect(stats.totalMisses).toBe(2);
      expect(stats.averagePrice).toBe(105); // (90+110+100+120)/4
    });

    it('should track timestamps for each price point', () => {
      const history = new PriceHistory(100);
      const now = Date.now();

      history.addPrice(105, true);

      const points = history.getHistory();

      expect(points[0].timestamp).toBeGreaterThanOrEqual(now);
      expect(points[0].timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Price Simulation', () => {
    it('should create realistic price movement over time', () => {
      let price = 100;
      const prices = [price];

      for (let i = 0; i < 20; i++) {
        const volatility = generateVolatility();
        price = calculateNewPrice(price, volatility);
        prices.push(price);
      }

      // Price should change
      expect(new Set(prices).size).toBeGreaterThan(10);

      // Price should stay within reasonable bounds (not crash to 0 or explode to infinity)
      prices.forEach(p => {
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1000);
      });
    });

    it('should handle edge cases in price calculations', () => {
      // Very small price
      let smallPrice = calculateNewPrice(0.0001, 0.05);
      expect(smallPrice).toBeGreaterThanOrEqual(0.0001);

      // Very large price
      let largePrice = calculateNewPrice(999999, 0.05);
      expect(largePrice).toBeFinite();

      // Zero volatility
      let samePrice = calculateNewPrice(100, 0);
      expect(samePrice).toBe(100);
    });
  });
});