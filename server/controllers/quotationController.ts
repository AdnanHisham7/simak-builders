import { Request, Response, NextFunction } from "express";
import { QuotationModel } from "@models/Quotation";
import { SiteModel } from "@models/Site";
import { UserRole } from "@models/User";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

const createQuotation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, vendorId, items, totalAmount } = req.body;
    const user = req.user;

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const canCreate =
      user.role === UserRole.CompanyAdmin ||
      (user.role === UserRole.SiteManager && site.siteManagers.includes(user._id) && user.enabledFunctionalities.includes("manage_quotations")) ||
      (user.role === UserRole.Supervisor && user.enabledFunctionalities.includes("manage_quotations"));

    if (!canCreate) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const quotation = new QuotationModel({
      site: siteId,
      vendor: vendorId,
      items,
      totalAmount,
      createdBy: user._id,
    });
    await quotation.save();

    res.status(HttpStatus.CREATED).json({ message: "Quotation created", quotationId: quotation._id });
  } catch (error) {
    next(error);
  }
};

const getQuotations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const user = req.user;

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const canAccess =
      user.role === UserRole.CompanyAdmin ||
      user.role === UserRole.Supervisor ||
      site.siteManagers.includes(user._id);

    if (!canAccess) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const quotations = await QuotationModel.find({ site: siteId });
    res.status(HttpStatus.OK).json(quotations);
  } catch (error) {
    next(error);
  }
};

export default { createQuotation, getQuotations };