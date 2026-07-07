/**
 * Portfolio Holding Model - MongoDB Schema
 * Stores user portfolio holdings with full data persistence
 */

import mongoose, { Schema, Document } from "mongoose";
import type { Holding } from "@/types";

interface HoldingDocument extends Document, Omit<Holding, "_id"> {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema<HoldingDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    avgPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseDate: {
      type: String,
      required: true,
    },
    broker: {
      type: String,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    invested: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValue: {
      type: Number,
      required: true,
      min: 0,
    },
    pnl: {
      type: Number,
      required: true,
    },
    pnlPercent: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
HoldingSchema.index({ userId: 1, symbol: 1 });
HoldingSchema.index({ userId: 1, createdAt: -1 });

export const HoldingModel = mongoose.model<HoldingDocument>("Holding", HoldingSchema, "holdings");

export type { HoldingDocument };
