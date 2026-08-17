import { Schema, model } from "mongoose";

const ExpenseRequestSchema = new Schema(
  {
    architect: { type: Schema.Types.ObjectId, ref: "User", required: true },
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: ["machinery", "rental", "service", "material"],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, default: "", trim: true, maxlength: 1000 },
    expenseId: { type: Schema.Types.ObjectId, ref: "MiscellaneousExpense" },
  },
  { timestamps: true },
);

export const ExpenseRequestModel = model("ExpenseRequest", ExpenseRequestSchema);