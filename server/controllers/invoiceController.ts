import { Request, Response, NextFunction } from "express";
import { InvoiceModel } from "@models/Invoice";
import { SiteModel } from "@models/Site";
import { UserRole } from "@models/User";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";

const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, amount } = req.body;
    const user = req.user;

    if (user.role !== UserRole.CompanyAdmin) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const invoice = new InvoiceModel({
      site: siteId,
      client: site.client,
      amount,
      createdBy: user._id,
    });
    await invoice.save();

    res.status(HttpStatus.CREATED).json({ message: "Invoice created", invoiceId: invoice._id });
  } catch (error) {
    next(error);
  }
};

const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const user = req.user;

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const canAccess =
      user.role === UserRole.CompanyAdmin ||
      (user.role === UserRole.Client && site.client.equals(user._id));

    if (!canAccess) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const invoices = await InvoiceModel.find({ site: siteId });
    res.status(HttpStatus.OK).json(invoices);
  } catch (error) {
    next(error);
  }
};

const updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, status } = req.body;
    const user = req.user;

    if (user.role !== UserRole.CompanyAdmin) throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) throw new ApiError("Invoice not found", HttpStatus.NOT_FOUND);

    invoice.status = status;
    await invoice.save();

    res.status(HttpStatus.OK).json({ message: "Invoice status updated" });
  } catch (error) {
    next(error);
  }
};

export default { createInvoice, getInvoices, updateInvoiceStatus };