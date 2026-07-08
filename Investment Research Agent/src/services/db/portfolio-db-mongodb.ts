/**
 * Portfolio Database - MongoDB Backend
 * Replaces localStorage with persistent backend storage
 * Falls back to localStorage if backend is unavailable
 */

import type { Holding } from "@/types";

const API_BASE = "/api/portfolio";
const FALLBACK_DB_KEY = "investa_portfolio_db_fallback";

// Helper to get user ID
function getUserId(): string {
  // In a real app, this would come from auth context
  return localStorage.getItem("user_id") || "default-user";
}

// Helper to make API calls with proper headers
async function apiCall(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  data?: unknown,
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "x-user-id": getUserId(),
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  return fetch(`${API_BASE}${endpoint}`, options);
}

/**
 * Get all holdings from MongoDB (with fallback to localStorage)
 */
export const getPortfolioHoldings = async (): Promise<Holding[]> => {
  try {
    const response = await apiCall("GET", "/holdings");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const holdings = await response.json();

    // Sync to localStorage as backup
    if (Array.isArray(holdings)) {
      localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(holdings));
    }

    return holdings;
  } catch (error) {
    console.warn("Failed to fetch from MongoDB, using localStorage fallback:", error);

    // Fallback to localStorage
    try {
      const data = localStorage.getItem(FALLBACK_DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
};

/**
 * Add a new holding to MongoDB via Transaction
 */
export const addHolding = async (holding: Holding): Promise<Holding> => {
  try {
    // 1. Post to Transaction endpoint (bypass /portfolio base)
    const userId = getUserId();
    const { apiClient } = await import('@/lib/api-client');
    
    let created;
    try {
      const response = await apiClient.post(`/transactions/${userId}?symbol=${holding.symbol}&type=BUY&quantity=${holding.quantity}&price=${holding.avgPrice}&broker=${holding.broker || 'Investa'}`);
      
      // 2. Fetch updated holdings to return the exact created/updated holding
      const all = await getPortfolioHoldings();
      created = all.find(h => h.symbol === holding.symbol) || holding;
    } catch (e) {
      // Fallback if transaction endpoint isn't ready
      const fallbackResponse = await apiCall("POST", "/holdings", holding);
      if (!fallbackResponse.ok) throw new Error(`HTTP ${fallbackResponse.status}`);
      created = await fallbackResponse.json();
    }

    // Update localStorage backup
    localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(all));

    return created;
  } catch (error) {
    console.warn("Failed to execute transaction in MongoDB, using localStorage fallback:", error);

    // Fallback to localStorage
    const all = await getPortfolioHoldings();
    all.unshift(holding);
    localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(all));

    return holding;
  }
};

/**
 * Remove a holding from MongoDB
 */
export const removeHolding = async (id: string): Promise<boolean> => {
  try {
    const response = await apiCall("DELETE", `/holdings/${id}`);

    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Update localStorage backup
    const all = await getPortfolioHoldings();
    const filtered = all.filter((h) => h.id !== id);
    localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(filtered));

    return true;
  } catch (error) {
    console.warn("Failed to remove holding from MongoDB, using localStorage fallback:", error);

    // Fallback to localStorage
    const all = await getPortfolioHoldings();
    const filtered = all.filter((h) => h.id !== id);
    localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(filtered));

    return true;
  }
};

/**
 * Update a holding in MongoDB
 */
export const updateHolding = async (
  id: string,
  updates: Partial<Holding>,
): Promise<Holding | null> => {
  try {
    const response = await apiCall("PUT", `/holdings/${id}`, updates);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}`);
    }

    const updated = await response.json();

    // Update localStorage backup
    const all = await getPortfolioHoldings();
    const index = all.findIndex((h) => h.id === id);
    if (index !== -1) {
      all[index] = updated;
      localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(all));
    }

    return updated;
  } catch (error) {
    console.warn("Failed to update holding in MongoDB, using localStorage fallback:", error);

    // Fallback to localStorage
    const all = await getPortfolioHoldings();
    const index = all.findIndex((h) => h.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates };
      localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(all));
      return all[index];
    }

    return null;
  }
};

/**
 * Check if MongoDB backend is available
 */
export const isMongoDBAvailable = async (): Promise<boolean> => {
  try {
    const response = await apiCall("GET", "/holdings");
    return response.ok || response.status === 401; // 401 means backend is up but user not auth
  } catch {
    return false;
  }
};

/**
 * Get database info for debugging
 */
export const getPortfolioDbInfo = async () => {
  try {
    const isAvailable = await isMongoDBAvailable();
    const holdings = await getPortfolioHoldings();

    return {
      backend: isAvailable ? "MongoDB" : "localStorage (fallback)",
      holdingsCount: holdings.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    return { error: String(error) };
  }
};
