import { Types } from "mongoose";

export interface Attendance {
  _id: Types.ObjectId;
  employee: Types.ObjectId;
  site: Types.ObjectId;
  date: Date;
  status: number; 
  dailyWage: number; 
  isPaid: boolean;
  markedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
