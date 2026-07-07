/**
 * Portfolio API Routes
 * REST endpoints for portfolio operations with MongoDB persistence
 */

import { Router } from "express";
import { HoldingModel } from "../models/portfolio.model";
import { connectMongoDB } from "../db/mongodb";
import type { Holding } from "@/types";

const router = Router();

// Middleware to ensure DB connection
router.use(async (req, res, next) => {
  try {
    await connectMongoDB();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

/**
 * GET /api/portfolio/holdings
 * Fetch all holdings for a user
 */
router.get("/holdings", async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "default-user";

    const holdings = await HoldingModel.find({ userId }).sort({ createdAt: -1 }).lean();

    // Convert Mongoose documents to plain Holding objects
    const plainHoldings = holdings.map(({ _id, ...rest }) => rest) as Holding[];

    res.json(plainHoldings);
  } catch (error) {
    console.error("GET /holdings error:", error);
    res.status(500).json({ error: "Failed to fetch holdings" });
  }
});

/**
 * POST /api/portfolio/holdings
 * Add a new holding
 */
router.post("/holdings", async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "default-user";
    const holding: Holding = req.body;

    // Validate required fields
    if (!holding.id || !holding.symbol || holding.quantity === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if holding already exists
    const existing = await HoldingModel.findOne({ id: holding.id });
    if (existing) {
      return res.status(409).json({ error: "Holding already exists" });
    }

    const newHolding = await HoldingModel.create({
      userId,
      ...holding,
    });

    const { _id, ...plainHolding } = newHolding.toObject();
    res.status(201).json(plainHolding);
  } catch (error) {
    console.error("POST /holdings error:", error);
    res.status(500).json({ error: "Failed to create holding" });
  }
});

/**
 * PUT /api/portfolio/holdings/:id
 * Update a holding
 */
router.put("/holdings/:id", async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "default-user";
    const { id } = req.params;
    const updates: Partial<Holding> = req.body;

    const updated = await HoldingModel.findOneAndUpdate(
      { id, userId },
      { $set: updates },
      { new: true, lean: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "Holding not found" });
    }

    const { _id, ...plainHolding } = updated;
    res.json(plainHolding);
  } catch (error) {
    console.error("PUT /holdings/:id error:", error);
    res.status(500).json({ error: "Failed to update holding" });
  }
});

/**
 * DELETE /api/portfolio/holdings/:id
 * Remove a holding
 */
router.delete("/holdings/:id", async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "default-user";
    const { id } = req.params;

    const deleted = await HoldingModel.findOneAndDelete({
      id,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Holding not found" });
    }

    res.json({ ok: true, id });
  } catch (error) {
    console.error("DELETE /holdings/:id error:", error);
    res.status(500).json({ error: "Failed to delete holding" });
  }
});

/**
 * GET /api/portfolio/stats
 * Get portfolio statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const userId = (req.headers["x-user-id"] as string) || "default-user";

    const holdings = await HoldingModel.find({ userId }).lean();

    const stats = {
      totalHoldings: holdings.length,
      totalInvested: holdings.reduce((sum, h) => sum + h.invested, 0),
      totalValue: holdings.reduce((sum, h) => sum + h.currentValue, 0),
      totalPnL: holdings.reduce((sum, h) => sum + h.pnl, 0),
      topHolding:
        holdings.length > 0
          ? holdings.reduce((max, h) => (h.currentValue > max.currentValue ? h : max))
          : null,
    };

    res.json(stats);
  } catch (error) {
    console.error("GET /stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
