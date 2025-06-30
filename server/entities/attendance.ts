import { Types } from "mongoose";
import { Employee } from "@entities/employee";

export interface Attendance {
  _id: Types.ObjectId;
  employee: Types.ObjectId | Employee;
  site: Types.ObjectId;
  date: Date;
  status: number; 
  dailyWage: number; 
  isPaid: boolean;
  markedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
