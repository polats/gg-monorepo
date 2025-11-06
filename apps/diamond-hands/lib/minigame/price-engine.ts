import type { PricePoint, PriceStatistics } from '@/types/minigame';
import { GAME_CONSTANTS } from '@/types/minigame';

/**
 * Generates random volatility within the expected range (-4% to +7%)
 */
export function generateVolatility(): number {
  const { MIN, MAX } = GAME_CONSTANTS.VOLATILITY_RANGE;
  const baseVolatility = 0.015; // 1.5% base
  const randomComponent = (Math.random() - 0.5) * 0.11; // -5.5% to +5.5%

  const volatility = baseVolatility + randomComponent;

  // Clamp to expected range
  return Math.max(MIN, Math.min(MAX, volatility));
}

/**
 * Calculates new price based on current price and volatility
 */
export function calculateNewPrice(currentPrice: number, volatility: number): number {
  const newPrice = currentPrice * (1 + volatility);
  const clampedPrice = Math.max(GAME_CONSTANTS.MIN_PRICE, newPrice);

  // Round to 4 decimal places
  return Math.round(clampedPrice * 10000) / 10000;
}

/**
 * Price history tracker with statistics
 */
export class PriceHistory {
  private points: PricePoint[] = [];
  private initialPrice: number;

  constructor(initialPrice: number) {
    this.initialPrice = initialPrice;
  }

  /**
   * Add a new price point to the history
   */
  addPrice(price: number, held: boolean): void {
    this.points.push({
      timestamp: new Date(),
      price,
      held,
    });

    // Limit to maximum history points
    if (this.points.length > GAME_CONSTANTS.MAX_HISTORY_POINTS) {
      this.points = this.points.slice(-GAME_CONSTANTS.MAX_HISTORY_POINTS);
    }
  }

  /**
   * Get the complete price history
   */
  getHistory(): PricePoint[] {
    return [...this.points];
  }

  /**
   * Calculate statistics from the price history
   */
  getStatistics(): PriceStatistics {
    if (this.points.length === 0) {
      return {
        highestPrice: this.initialPrice,
        lowestPrice: this.initialPrice,
        totalHolds: 0,
        totalMisses: 0,
        averagePrice: this.initialPrice,
      };
    }

    const prices = this.points.map(p => p.price);
    const totalHolds = this.points.filter(p => p.held).length;
    const totalMisses = this.points.filter(p => !p.held).length;

    return {
      highestPrice: Math.max(...prices),
      lowestPrice: Math.min(...prices),
      totalHolds,
      totalMisses,
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    };
  }

  /**
   * Get the current (latest) price
   */
  getCurrentPrice(): number {
    if (this.points.length === 0) {
      return this.initialPrice;
    }
    return this.points[this.points.length - 1].price;
  }

  /**
   * Reset the history
   */
  reset(newInitialPrice?: number): void {
    this.points = [];
    if (newInitialPrice !== undefined) {
      this.initialPrice = newInitialPrice;
    }
  }
}