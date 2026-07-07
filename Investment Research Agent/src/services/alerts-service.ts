import { MOCK_ALERTS } from "./mock-data";
import type { Alert } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
let alerts = [...MOCK_ALERTS];

/**
 * TODO: Replace with Spring Boot endpoints:
 *   GET    /api/alerts
 *   POST   /api/alerts
 *   DELETE /api/alerts/{id}
 */
export const alertsService = {
  async list(): Promise<Alert[]> {
    await delay(120);
    return alerts;
  },
  async add(input: Omit<Alert, "id" | "createdAt" | "active">): Promise<Alert> {
    await delay(150);
    const created: Alert = {
      ...input,
      id: "al-" + Math.random().toString(36).slice(2, 8),
      active: true,
      createdAt: new Date().toISOString(),
    };
    alerts = [created, ...alerts];
    return created;
  },
  async remove(id: string): Promise<{ ok: true }> {
    await delay(100);
    alerts = alerts.filter((a) => a.id !== id);
    return { ok: true };
  },
};
