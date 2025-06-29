export interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isSeen?: boolean; // Added isSeen field
  createdAt: Date;
  updatedAt: Date;
}