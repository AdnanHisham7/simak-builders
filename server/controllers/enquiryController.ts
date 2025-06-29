import { Request, Response, NextFunction } from "express";
import { EnquiryModel } from "@models/Enquiry";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ApiError } from "@utils/errors/ApiError";

const getEnquiries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enquiries = await EnquiryModel.find().sort({ createdAt: -1 });
    res.status(HttpStatus.OK).json(enquiries);
  } catch (error) {
    next(error);
  }
};

const getEnquiryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const enquiry = await EnquiryModel.findById(id);
    if (!enquiry) {
      throw new ApiError("Enquiry not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.OK).json(enquiry);
  } catch (error) {
    next(error);
  }
};

const createEnquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !phone || !subject || !message) {
      throw new ApiError("Missing required fields", HttpStatus.BAD_REQUEST);
    }
    const newEnquiry = await EnquiryModel.create({ name, email, phone, subject, message });
    res.status(HttpStatus.CREATED).json(newEnquiry);
  } catch (error) {
    next(error);
  }
};

const markEnquiryAsSeen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const enquiry = await EnquiryModel.findByIdAndUpdate(id, { isSeen: true }, { new: true });
    if (!enquiry) {
      throw new ApiError("Enquiry not found", HttpStatus.NOT_FOUND);
    }
    res.status(HttpStatus.OK).json(enquiry);
  } catch (error) {
    next(error);
  }
};

const getUnseenEnquiriesCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await EnquiryModel.countDocuments({ isSeen: false });
    res.status(HttpStatus.OK).json({ count });
  } catch (error) {
    next(error);
  } 
};

export default { getEnquiries, getEnquiryById, createEnquiry,getUnseenEnquiriesCount, markEnquiryAsSeen };