import { Schema, model, Document, Types } from "mongoose";

export interface ILenderHistory {
  type: "borrow" | "settlement";
  amount: number;
  date: Date;
  notes?: string;
  transactionId?: Types.ObjectId;
}

export interface ILender extends Document {
  name: string;
  phone?: string;
  notes?: string;
  totalLended: number;
  totalSettled: number;
  outstandingBalance: number;
  history: ILenderHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const LenderHistorySchema = new Schema<ILenderHistory>(
  {
    type: { type: String, enum: ["borrow", "settlement"], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    transactionId: { type: Schema.Types.ObjectId },
  },
  { _id: true }
);

const LenderSchema = new Schema<ILender>(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    totalLended: { type: Number, default: 0 },
    totalSettled: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    history: [LenderHistorySchema],
  },
  { timestamps: true }
);

LenderSchema.index({ name: 1 });

export const LenderModel = model<ILender>("Lender", LenderSchema);
