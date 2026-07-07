import type { Alert } from "@/types";
import { finnhubStocksService } from "./finnhub-stocks-service";

const STORAGE_KEY = "investment_dashboard_alerts";

/**
 * Alerts Service - Persistent local storage
 *
 * Stores price alerts and technical alerts in localStorage
 * Monitoring happens client-side on app visibility
 *
 * Production: Replace with:
 * - Backend API for persistent storage
 * - WebSocket or polling for real-time monitoring
 * - Server-side alert triggering with notifications
 */
export const alertsService = {
  /**
   * Get all alerts
   */
  async list(): Promise<Alert[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return [];
    }
  },

  /**
   * Create new alert
   */
  async add(input: Omit<Alert, "id" | "createdAt" | "active">): Promise<Alert> {
    try {
      // Validate stock exists
      const stock = await finnhubStocksService.getQuote(input.symbol);
      if (!stock) {
        throw new Error(`Symbol ${input.symbol} not found`);
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      const alerts: Alert[] = stored ? JSON.parse(stored) : [];

      const created: Alert = {
        ...input,
        id: "al-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        active: true,
        createdAt: new Date().toISOString(),
      };

      alerts.unshift(created);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));

      return created;
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  },

  /**
   * Update alert
   */
  async update(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const alerts: Alert[] = stored ? JSON.parse(stored) : [];

      const index = alerts.findIndex((a) => a.id === id);
      if (index === -1) return null;

      alerts[index] = {
        ...alerts[index],
        ...updates,
        id: alerts[index].id,
        createdAt: alerts[index].createdAt,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
      return alerts[index];
    } catch (error) {
      console.error("Error updating alert:", error);
      return null;
    }
  },

  /**
   * Remove alert
   */
  async remove(id: string): Promise<{ ok: true } | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const alerts = stored ? JSON.parse(stored) : [];

      const filtered = alerts.filter((a: Alert) => a.id !== id);

      if (filtered.length === alerts.length) {
        return null;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return { ok: true };
    } catch (error) {
      console.error("Error removing alert:", error);
      return null;
    }
  },

  /**
   * Toggle alert active status
   */
  async toggle(id: string): Promise<Alert | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const alerts: Alert[] = stored ? JSON.parse(stored) : [];

      const index = alerts.findIndex((a) => a.id === id);
      if (index === -1) return null;

      alerts[index].active = !alerts[index].active;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));

      return alerts[index];
    } catch (error) {
      console.error("Error toggling alert:", error);
      return null;
    }
  },

  /**
   * Check all active alerts for trigger conditions
   * Returns alerts that should be triggered
   */
  async checkAlerts(): Promise<Array<Alert & { triggered: boolean }>> {
    try {
      const alerts = await this.list();
      const activeAlerts = alerts.filter((a) => a.active);

      const triggered: Array<Alert & { triggered: boolean }> = [];

      for (const alert of activeAlerts) {
        const stock = await finnhubStocksService.getQuote(alert.symbol);
        if (!stock) continue;

        let shouldTrigger = false;

        switch (alert.type) {
          case "price":
            if (alert.condition === "above" && stock.price > alert.value) {
              shouldTrigger = true;
            } else if (alert.condition === "below" && stock.price < alert.value) {
              shouldTrigger = true;
            }
            break;

          case "volume":
            if (stock.volume && alert.condition === "above" && stock.volume > alert.value) {
              shouldTrigger = true;
            }
            break;

          // Technical indicators would require historical data
          case "ma":
          case "rsi":
          case "ema":
            // Placeholder: In production, fetch technical indicators
            break;
        }

        if (shouldTrigger && !alert.triggered) {
          triggered.push({
            ...alert,
            triggered: true,
          });

          // Mark as triggered
          await this.update(alert.id, { triggered: true });
        }
      }

      return triggered;
    } catch (error) {
      console.error("Error checking alerts:", error);
      return [];
    }
  },

  /**
   * Clear triggered status for an alert
   */
  async resetTriggered(id: string): Promise<Alert | null> {
    return this.update(id, { triggered: false });
  },

  /**
   * Get alerts for a specific symbol
   */
  async getForSymbol(symbol: string): Promise<Alert[]> {
    try {
      const alerts = await this.list();
      return alerts.filter((a) => a.symbol === symbol.toUpperCase());
    } catch (error) {
      console.error("Error getting alerts for symbol:", error);
      return [];
    }
  },

  /**
   * Get active alerts count
   */
  async getActiveCount(): Promise<number> {
    try {
      const alerts = await this.list();
      return alerts.filter((a) => a.active).length;
    } catch (error) {
      console.error("Error getting active alerts count:", error);
      return 0;
    }
  },

  /**
   * Clear all alerts
   */
  async clear(): Promise<{ ok: true }> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return { ok: true };
    } catch (error) {
      console.error("Error clearing alerts:", error);
      throw error;
    }
  },
};
