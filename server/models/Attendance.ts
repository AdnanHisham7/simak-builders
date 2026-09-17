import { Schema, model } from "mongoose";
import { Attendance } from "@entities/attendance";

const AttendanceSchema = new Schema<Attendance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    date: { type: Date, required: true },
    status: { type: Number, min: 0, max: 1, required: true },
    dailyWage: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientMutationId: { type: String, index: true },
    version: { type: Number, default: 1 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AttendanceSchema.index({ site: 1, createdAt: -1 });
AttendanceSchema.index({ employee: 1, date: -1 });
AttendanceSchema.index({ site: 1, employee: 1, date: 1 });
AttendanceSchema.index({ updatedAt: -1 });

export const AttendanceModel = model<Attendance>("Attendance", AttendanceSchema);