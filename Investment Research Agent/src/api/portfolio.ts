/**
 * API Route Handler for Portfolio
 * TanStack Start compatible API endpoint
 */

import { connectMongoDB } from "../../server/db/mongodb";
import { HoldingModel } from "../../server/models/portfolio.model";
import type { Holding } from "@/types";

// Helper to get user ID from request headers
function getUserId(request: Request): string {
  return (request.headers.get("x-user-id") as string) || "default-user";
}

/**
 * GET /api/portfolio/holdings
 */
export async function GET(request: Request) {
  try {
    await connectMongoDB();
    const userId = getUserId(request);

    const holdings = await HoldingModel.find({ userId }).sort({ createdAt: -1 }).lean();

    const plainHoldings = holdings.map(({ _id, ...rest }: any) => rest) as Holding[];

    return new Response(JSON.stringify(plainHoldings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/portfolio/holdings error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch holdings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/portfolio/holdings
 */
export async function POST(request: Request) {
  try {
    await connectMongoDB();
    const userId = getUserId(request);
    const holding: Holding = await request.json();

    if (!holding.id || !holding.symbol || holding.quantity === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existing = await HoldingModel.findOne({ id: holding.id });
    if (existing) {
      return new Response(JSON.stringify({ error: "Holding already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newHolding = await HoldingModel.create({
      userId,
      ...holding,
    });

    const { _id, ...plainHolding } = newHolding.toObject();

    return new Response(JSON.stringify(plainHolding), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/portfolio/holdings error:", error);
    return new Response(JSON.stringify({ error: "Failed to create holding" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * PUT /api/portfolio/holdings/:id
 */
export async function PUT(request: Request, { id }: { id: string }) {
  try {
    await connectMongoDB();
    const userId = getUserId(request);
    const updates: Partial<Holding> = await request.json();

    const updated = await HoldingModel.findOneAndUpdate(
      { id, userId },
      { $set: updates },
      { new: true, lean: true },
    );

    if (!updated) {
      return new Response(JSON.stringify({ error: "Holding not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { _id, ...plainHolding } = updated;

    return new Response(JSON.stringify(plainHolding), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PUT /api/portfolio/holdings/:id error:", error);
    return new Response(JSON.stringify({ error: "Failed to update holding" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/portfolio/holdings/:id
 */
export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    await connectMongoDB();
    const userId = getUserId(request);

    const deleted = await HoldingModel.findOneAndDelete({
      id,
      userId,
    });

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Holding not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DELETE /api/portfolio/holdings/:id error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete holding" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
