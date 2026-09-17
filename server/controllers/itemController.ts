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

const updateItemThreshold = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { threshold } = req.body;
    const item = await ItemModel.findByIdAndUpdate(
      itemId,
      { lowStockThreshold: Math.max(0, Number(threshold) || 0) },
      { new: true }
    );
    if (!item) {
      res.status(HttpStatus.NOT_FOUND).json({ message: "Item not found" });
      return;
    }
    res.status(HttpStatus.OK).json({ message: "Item threshold updated", item });
  } catch (error) {
    next(error);
  }
};

export default {
  searchItems,
  getItems,
  updateItemThreshold,
};