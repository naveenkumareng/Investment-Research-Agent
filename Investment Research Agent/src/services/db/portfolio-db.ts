/**
 * Portfolio Database - localStorage persistence layer
 * Handles storing and retrieving portfolio holdings without affecting other services
 */

import type { Holding } from "@/types";

const PORTFOLIO_DB_KEY = "investa_portfolio_db_v1";

interface PortfolioDatabase {
  holdings: Holding[];
  lastUpdated: number;
}

const getDefaultDb = (): PortfolioDatabase => ({
  holdings: [],
  lastUpdated: Date.now(),
});

/**
 * Get all holdings from localStorage
 */
export const getPortfolioHoldings = (): Holding[] => {
  try {
    const data = localStorage.getItem(PORTFOLIO_DB_KEY);
    if (!data) return [];
    const db: PortfolioDatabase = JSON.parse(data);
    return db.holdings || [];
  } catch (error) {
    console.error("Failed to load portfolio from storage:", error);
    return [];
  }
};

/**
 * Save holdings to localStorage
 */
export const savePortfolioHoldings = (holdings: Holding[]): void => {
  try {
    const db: PortfolioDatabase = {
      holdings,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(PORTFOLIO_DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Failed to save portfolio to storage:", error);
  }
};

/**
 * Add a new holding to the database
 */
export const addHolding = (holding: Holding): Holding => {
  const holdings = getPortfolioHoldings();
  holdings.unshift(holding); // Add to beginning
  savePortfolioHoldings(holdings);
  return holding;
};

/**
 * Remove a holding by ID
 */
export const removeHolding = (id: string): boolean => {
  const holdings = getPortfolioHoldings();
  const filtered = holdings.filter((h) => h.id !== id);
  if (filtered.length === holdings.length) return false; // Not found
  savePortfolioHoldings(filtered);
  return true;
};

/**
 * Update a holding
 */
export const updateHolding = (id: string, updates: Partial<Holding>): Holding | null => {
  const holdings = getPortfolioHoldings();
  const index = holdings.findIndex((h) => h.id === id);
  if (index === -1) return null;

  holdings[index] = { ...holdings[index], ...updates };
  savePortfolioHoldings(holdings);
  return holdings[index];
};

/**
 * Clear all holdings (use with caution)
 */
export const clearPortfolioData = (): void => {
  localStorage.removeItem(PORTFOLIO_DB_KEY);
};

/**
 * Get database info for debugging
 */
export const getPortfolioDbInfo = () => {
  try {
    const data = localStorage.getItem(PORTFOLIO_DB_KEY);
    if (!data) return { exists: false, holdings: 0 };
    const db: PortfolioDatabase = JSON.parse(data);
    return {
      exists: true,
      holdings: db.holdings.length,
      lastUpdated: new Date(db.lastUpdated).toISOString(),
    };
  } catch (error) {
    return { exists: false, error: String(error) };
  }
};
