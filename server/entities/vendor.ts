import { Types } from "mongoose";

export interface Vendor {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}