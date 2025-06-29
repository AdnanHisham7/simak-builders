import { Schema, model } from "mongoose";
import { Employee } from "@entities/employee";

const EmployeeSchema = new Schema<Employee>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    dailyWage: { type: Number, required: true },
  },
  { timestamps: true }
);

export const EmployeeModel = model<Employee>("Employee", EmployeeSchema);
