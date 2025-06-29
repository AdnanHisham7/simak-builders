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
  },
  { timestamps: true }
);

export const AttendanceModel = model<Attendance>("Attendance", AttendanceSchema);