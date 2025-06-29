import { Types } from "mongoose";

export interface Employee {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  position: string;
  dailyWage: number;
  createdAt: Date;
  updatedAt: Date;
}