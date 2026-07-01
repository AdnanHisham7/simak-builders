import { Request, Response, NextFunction } from "express";
import { ItemModel } from "@models/Item";
import { HttpStatus } from "@utils/enums/httpStatus";
import { searchItemSuggestions } from "@utils/itemMaster";

const searchItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string) || "";
    const suggestions = await searchItemSuggestions(query, 8);
    res.status(HttpStatus.OK).json(suggestions);
  } catch (error) {
    next(error);
  }
};

const getItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await ItemModel.find({}).sort({ name: 1 });
    res.status(HttpStatus.OK).json(items);
  } catch (error) {
    next(error);
  }
};

export default {
  searchItems,
  getItems,
};