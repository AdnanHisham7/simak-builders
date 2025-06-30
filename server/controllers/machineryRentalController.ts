// controllers/machineryRentalController.ts
import { Request, Response, NextFunction } from "express";
import { MachineryRentalModel } from "@models/MachineryRental";
import { CompanyModel } from "@models/Company";
import { SiteModel } from "@models/Site";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { UserModel } from "@models/User";
import { ActivityLogModel } from "@models/ActivityLog";
import { NotificationModel } from "@models/Notification";

const addMachineryRental = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId, description, amount, date } = req.body;
    const user = await UserModel.findById(req.user?.userId);
    if (!user) throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new ApiError("Invalid amount", HttpStatus.BAD_REQUEST);
    }

    let site;
    if (siteId) {
      site = await SiteModel.findById(siteId);
      if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);
    }

    if (user.role === "siteManager") {
      if (user.siteExpensesBalance < parsedAmount) {
        throw new ApiError(
          "Insufficient site expenses balance",
          HttpStatus.BAD_REQUEST
        );
      }
    } else if (user.role === "admin") {
      const company = await CompanyModel.findOne();
      if (!company)
        throw new ApiError(
          "Company not found",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      if (company.totalAmount < parsedAmount) {
        throw new ApiError(
          "Insufficient company funds",
          HttpStatus.BAD_REQUEST
        );
      }
    } else {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    const machineryRental = new MachineryRentalModel({
      site: siteId || null,
      description,
      amount: parsedAmount,
      date,
      addedBy: req.user?.userId,
      status: "pending",
    });
    await machineryRental.save();

    const admins = await UserModel.find({ role: "admin" });
    for (const admin of admins) {
      const notification = new NotificationModel({
        user: admin._id,
        type: "machinery_rental_verification",
        relatedId: machineryRental._id,
        message: `New machinery rental of $${
          machineryRental.amount
        } needs verification for site ${
          site?.name || machineryRental.site || "company"
        }`,
        status: "pending",
      });
      await notification.save();
    }

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "machineryRental",
      resourceId: machineryRental._id,
      details: `Added machinery rental for site: ${
        site?.name || machineryRental.site || "company"
      }`,
    });

    if (user.role === "siteManager") {
      const transaction: any = {
        date: new Date(),
        amount: -parsedAmount,
        type: "expenditure",
        description: `Machinery/Rental for site ${
          site?.name || siteId || "company"
        }`,
        site: siteId || null,
      };
      user.siteExpensesTransactions.push(transaction);
      user.siteExpensesBalance -= parsedAmount;
      await user.save();
    } else if (user.role === "admin") {
      const company = await CompanyModel.findOne();
      if (!company)
        throw new ApiError(
          "Company not found",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      if (company.totalAmount < parsedAmount) {
        throw new ApiError(
          "Insufficient company funds",
          HttpStatus.BAD_REQUEST
        );
      }
      company.totalAmount -= parsedAmount;
      const transaction = {
        date: new Date(),
        amount: -parsedAmount,
        type: "expenditure",
        description: `Machinery/Rental added${
          siteId ? ` for site ${site?.name || siteId}` : ""
        }`,
        site: siteId || null,
      };
      company.transactions.push(transaction);
      await company.save();
    }

    res.status(HttpStatus.CREATED).json({
      message: "Machinery/Rental added",
      machineryRentalId: machineryRental._id,
    });
  } catch (error) {
    next(error);
  }
};

const verifyMachineryRental = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rentalId } = req.params;
    const user = req.user;
    if (user?.role !== "admin")
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);

    const rental: any = await MachineryRentalModel.findById(rentalId).populate(
      "site"
    );
    if (!rental)
      throw new ApiError("Machinery rental not found", HttpStatus.NOT_FOUND);

    rental.status = "verified";
    await rental.save();

    await NotificationModel.updateMany(
      { relatedId: rentalId, type: "machinery_rental_verification" },
      { status: "approved" }
    );

    const notification = new NotificationModel({
      user: rental.addedBy,
      type: "machinery_rental_update",
      relatedId: rental._id,
      message: `Your machinery rental of $${rental.amount} for site ${
        rental.site?.name || "company"
      } has been verified`,
      status: "approved",
    });
    await notification.save();

    if (rental.site) {
      const site = await SiteModel.findById(rental.site?._id);
      const purchasedUser = await UserModel.findOne(rental.addedBy);
      console.log(purchasedUser, rental.addedBy);
      if (site) {
        site.expenses += rental.amount;
        site.transactions.push({
          date: new Date(),
          amount: rental.amount,
          type: "rental",
          description: `Machinery rental by ${purchasedUser?.name}`,
          relatedId: rental._id,
          user: purchasedUser?._id.toString(),
        });
        await site.save();
      }
    }

    res.status(HttpStatus.OK).json({ message: "Machinery rental verified" });
  } catch (error) {
    next(error);
  }
};

const getMachineryRentalsBySite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.query;
    if (!siteId)
      throw new ApiError("siteId is required", HttpStatus.BAD_REQUEST);

    const rentals = await MachineryRentalModel.find({ site: siteId }).populate(
      "addedBy"
    );
    res.status(HttpStatus.OK).json(rentals);
  } catch (error) {
    next(error);
  }
};

export default {
  addMachineryRental,
  getMachineryRentalsBySite,
  verifyMachineryRental,
};
