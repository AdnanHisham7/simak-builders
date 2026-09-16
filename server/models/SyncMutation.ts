import { Schema, model, Types } from "mongoose";

export interface ISyncMutation {
  clientMutationId: string;
  entity: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  recordId: string;
  userId: Types.ObjectId;
  status: "synced" | "failed" | "conflict";
  serverId?: string;
  serverVersion?: number;
  error?: string;
  createdAt: Date;
}

const SyncMutationSchema = new Schema<ISyncMutation>(
  {
    clientMutationId: { type: String, required: true, unique: true, index: true },
    entity: { type: String, required: true },
    operation: { type: String, enum: ["CREATE", "UPDATE", "DELETE"], required: true },
    recordId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["synced", "failed", "conflict"], required: true },
    serverId: { type: String },
    serverVersion: { type: Number },
    error: { type: String },
  },
  { timestamps: true }
);

// Auto-cleanup processed mutation records after 30 days
SyncMutationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const SyncMutationModel = model<ISyncMutation>("SyncMutation", SyncMutationSchema);
