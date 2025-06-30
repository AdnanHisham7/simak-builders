import { Request, Response, NextFunction } from "express";
import { CompanyModel } from "@models/Company";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ClientTransactionModel } from "./clientController";
import { EmployeeModel } from "@models/Employee";
import { SiteModel } from "@models/Site";
import { StockModel } from "@models/Stock";
import { AttendanceModel } from "@models/Attendance";
import { ActivityLogModel } from "@models/ActivityLog";
import { UserModel } from "@models/User";
import { VendorModel } from "@models/Vendor";
import { ContractorModel } from "@models/Contractor";
import upload from "@middleware/multer";
import Joi from "joi";
import mongoose, { startSession, Types } from "mongoose";
import { PurchaseModel } from "@models/Purchase";
import { MachineryRentalModel } from "@models/MachineryRental";
import { StockUsageModel } from "@models/StockUsage";
import { ContractorTransactionModel } from "@models/ContractorTransaction";

const initializeComapny = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const company = new CompanyModel({
      totalAmount: 20000,
    });
    await company.save();

    res.status(HttpStatus.CREATED).json({
      message: "Company Initialized",
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalEmployees = await EmployeeModel.countDocuments();
    const totalSites = await SiteModel.countDocuments();
    const totalStocks = await StockModel.countDocuments();

    const clientsCount = await UserModel.countDocuments({
      role: "client",
      isBlocked: false,
    });
    const architectsCount = await UserModel.countDocuments({
      role: "architect",
      isBlocked: false,
    });
    const vendorsCount = await VendorModel.countDocuments();
    const contractorsCount = await ContractorModel.countDocuments({
      status: "active",
    });

    const stockDistribution = await StockModel.aggregate([
      { $group: { _id: "$category", value: { $sum: "$quantity" } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
    ]);

    const monthlyRevenue = await CompanyModel.aggregate([
      { $unwind: "$transactions" },
      { $match: { "transactions.type": { $in: ["incoming", "expenditure"] } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$transactions.date" },
          },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ["$transactions.type", "incoming"] },
                "$transactions.amount",
                0,
              ],
            },
          },
          expenses: {
            $sum: {
              $cond: [
                { $eq: ["$transactions.type", "expenditure"] },
                "$transactions.amount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]).then((data) =>
      data.map((d) => ({
        month: d._id,
        revenue: d.revenue,
        expenses: d.expenses,
      }))
    );

    const pendingTransactions = await ClientTransactionModel.find({
      status: "pending",
    }).populate("client", "name email");

    const sites = await SiteModel.find().select("name phases");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const sitePerformance = await Promise.all(
      sites.map(async (site) => {
        const completedPhases = site.phases.filter(
          (phase) => phase.status === "completed"
        ).length;
        const totalPhases = site.phases.length;
        const efficiency =
          totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

        const attendances = await AttendanceModel.find({
          site: site._id,
          date: { $gte: thirtyDaysAgo },
        });

        const totalAttendance = attendances.reduce(
          (sum, att) => sum + att.status,
          0
        );
        const averageAttendance =
          attendances.length > 0 ? totalAttendance / attendances.length : 0;
        const utilization = averageAttendance * 100;

        return {
          name: site.name,
          efficiency: Math.round(efficiency),
          utilization: Math.round(utilization),
        };
      })
    );

    // Fetch recent activities
    const recentEmployees = await EmployeeModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name createdAt");
    const recentSites = await SiteModel.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name updatedAt");
    const recentStocks = await StockModel.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name updatedAt");

    const activities = [
      ...recentEmployees.map((emp) => ({
        id: emp._id.toString(),
        type: "employee",
        description: `New employee ${emp.name} onboarded`,
        timestamp: emp.createdAt.toISOString(),
      })),
      ...recentSites.map((site) => ({
        id: site._id.toString(),
        type: "site",
        description: `Site ${site.name} updated`,
        timestamp: site.updatedAt.toISOString(),
      })),
      ...recentStocks.map((stock) => ({
        id: stock._id.toString(),
        type: "stock",
        description: `Stock ${stock.name} updated`,
        timestamp: stock.updatedAt?.toISOString(),
      })),
    ];

    // Sort by timestamp and take the top 5
    const recentActivity = activities
      .filter((activity) => activity.timestamp !== undefined)
      .sort(
        (a, b) =>
          new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
      )
      .slice(0, 5);

    res.status(HttpStatus.OK).json({
      totalEmployees,
      totalSites,
      totalStocks,
      clientsCount,
      architectsCount,
      vendorsCount,
      contractorsCount,
      stockDistribution,
      monthlyRevenue,
      pendingTransactions,
      sitePerformance,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

const getAllActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activityLogs = await ActivityLogModel.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate("user", "name");
    res.status(HttpStatus.OK).json(activityLogs);
  } catch (error) {
    next(error);
  }
};

// Bulk Import for Site
const createSiteWithBulkData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      throw new ApiError("No authorization", HttpStatus.BAD_REQUEST);
    }

    const jsonData = JSON.parse(req.body.data);
    const files = req.files as Express.Multer.File[];

    const defaultPhases = [
      "Site Visit",
      "Prepare Plan and elevating detailed drawings",
      "Permit",
      "Settout Foundation Basement Belt Masonry, concrete work",
      "Wiring & plumbing",
      "Plastering, waterproofing",
      "White washing",
      "Floor work",
      "Interior work",
      "Paint work",
    ];

    const schema = Joi.object({
      site: Joi.object({
        name: Joi.string().required(),
        address: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zip: Joi.string().required(),
        client: Joi.string().required(),
        budget: Joi.number().required(),
        status: Joi.string().valid("InProgress", "Completed").optional(),
      }).required(),
      phases: Joi.array()
        .items(
          Joi.object({
            name: Joi.string()
              .valid(...defaultPhases)
              .required(),
            status: Joi.string().valid("not started", "completed").required(),
          })
        )
        .length(10)
        .required(),
      purchases: Joi.array()
        .items(
          Joi.object({
            vendor: Joi.string().required(),
            items: Joi.array()
              .items(
                Joi.object({
                  name: Joi.string().required(),
                  unit: Joi.string().required(),
                  category: Joi.string().required(),
                  quantity: Joi.number().required(),
                  price: Joi.number().required(),
                })
              )
              .required(),
            totalAmount: Joi.number().required(),
          })
        )
        .optional(),
      machineryRentals: Joi.array()
        .items(
          Joi.object({
            description: Joi.string().required(),
            amount: Joi.number().required(),
            date: Joi.date().required(),
          })
        )
        .optional(),
      attendances: Joi.array()
        .items(
          Joi.object({
            employee: Joi.string().required(),
            date: Joi.date().required(),
            status: Joi.number().min(0).max(1).required(),
            dailyWage: Joi.number().required(),
          })
        )
        .optional(),
      stockUsages: Joi.array()
        .items(
          Joi.object({
            stock: Joi.string().required(),
            quantity: Joi.number().required(),
            usageDate: Joi.date(),
          })
        )
        .optional(),
      contractorTransactions: Joi.array()
        .items(
          Joi.object({
            contractor: Joi.string().required(),
            type: Joi.string()
              .valid("advance", "expense", "additional_payment")
              .required(),
            amount: Joi.number().required(),
            description: Joi.string(),
            date: Joi.date(),
          })
        )
        .optional(),
    });

    const { error } = schema.validate(jsonData);
    if (error) {
      throw new ApiError(
        `Validation error: ${error.details[0].message}`,
        HttpStatus.BAD_REQUEST
      );
    }

    let totalExpenditure = 0;
    if (jsonData.purchases) {
      totalExpenditure += jsonData.purchases.reduce(
        (sum: any, p: { totalAmount: any }) => sum + p.totalAmount,
        0
      );
    }
    if (jsonData.machineryRentals) {
      totalExpenditure += jsonData.machineryRentals.reduce(
        (sum: any, r: { amount: any }) => sum + r.amount,
        0
      );
    }
    if (jsonData.attendances) {
      totalExpenditure += jsonData.attendances.reduce(
        (sum: any, a: { dailyWage: any }) => sum + a.dailyWage,
        0
      );
    }
    if (jsonData.contractorTransactions) {
      totalExpenditure += jsonData.contractorTransactions.reduce(
        (sum: any, t: { amount: any }) => sum + t.amount,
        0
      );
    }

    const company = await CompanyModel.findOne();
    if (!company) {
      throw new ApiError("Company not found", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (company.totalAmount < totalExpenditure) {
      throw new ApiError("Insufficient company funds", HttpStatus.BAD_REQUEST);
    }

    const newSite = new SiteModel({
      ...jsonData.site,
      client: new mongoose.Types.ObjectId(jsonData.site.client),
      phases: jsonData.phases.map((phase: { name: any; status: string }) => ({
        name: phase.name,
        status: phase.status,
        completionDate: phase.status === "completed" ? new Date() : null,
        requestedBy: adminUser.userId,
      })),
      documents: [],
      transactions: [],
      expenses: 0,
    });
    await newSite.save();

    // Arrays to track saved documents for cleanup
    const savedPurchases = [];
    const savedRentals = [];
    const savedAttendances = [];
    const savedStockUsages = [];
    const savedContractorTransactions = [];

    try {
      // Process documents from uploaded files
      const documentFiles = files.filter((f) =>
        f.fieldname.startsWith("documents[")
      );
      for (const docFile of documentFiles) {
        const document = {
          name: docFile.originalname,
          size: docFile.size,
          type: docFile.mimetype,
          url: `/uploads/${docFile.filename}`,
          uploadedBy: new Types.ObjectId(adminUser.userId), 
          uploadDate: new Date(),
        };
        newSite.documents.push(document);
      }

      // Process purchases with bill uploads
      if (jsonData.purchases) {
        for (const [index, purchaseData] of jsonData.purchases.entries()) {
          const billFieldName = `purchases[${index}].billUpload`;
          const billFile = files.find((f) => f.fieldname === billFieldName);
          let billUpload = null;
          if (billFile) {
            billUpload = {
              name: billFile.originalname,
              size: billFile.size,
              type: billFile.mimetype,
              uploadDate: new Date().toISOString(),
              url: `/uploads/${billFile.filename}`,
            };
          }

          const purchase = new PurchaseModel({
            ...purchaseData,
            site: newSite._id,
            addedBy: adminUser.userId,
            status: "verified",
            billUpload,
          });
          await purchase.save();
          savedPurchases.push(purchase._id);

          // Update stocks since purchase is verified
          for (const item of purchase.items) {
            const { name, unit, category, quantity } = item;
            const stockQuery = { name, unit, category, site: newSite._id };
            let stock = await StockModel.findOne(stockQuery);
            if (!stock) {
              stock = new StockModel({
                name,
                quantity: 0,
                unit,
                category,
                site: newSite._id,
              });
            }
            stock.quantity += quantity;
            await stock.save();
          }

          // Add transaction to site
          newSite.transactions.push({
            date: new Date(),
            amount: purchase.totalAmount,
            type: "purchase",
            description: `Purchase from vendor ${purchaseData.vendor}`,
            relatedId: purchase._id,
            user: adminUser.userId,
          });

          newSite.expenses += purchase.totalAmount;
          newSite.budget -= purchase.totalAmount;
          // Update company transaction
          // company.totalAmount -= purchase.totalAmount;
          // company.transactions.push({
          //   date: new Date(),
          //   amount: -purchase.totalAmount,
          //   type: "expenditure",
          //   description: `Purchase for site ${newSite.name}`,
          //   site: newSite._id,
          // });
        }
      }

      // Process machinery rentals
      if (jsonData.machineryRentals) {
        for (const rentalData of jsonData.machineryRentals) {
          const rental = new MachineryRentalModel({
            ...rentalData,
            site: newSite._id,
            addedBy: adminUser.userId,
            status: "verified",
          });
          await rental.save();
          savedRentals.push(rental._id);
          newSite.transactions.push({
            date: rentalData.date,
            amount: rental.amount,
            type: "rental",
            description: rentalData.description,
            relatedId: rental._id,
            user: adminUser.userId,
          });

          newSite.expenses += rental.amount;
          newSite.budget -= rental.amount;
          // company.totalAmount -= rental.amount;
          // company.transactions.push({
          //   date: rentalData.date,
          //   amount: -rental.amount,
          //   type: "expenditure",
          //   description: `Machinery rental for site ${newSite.name}`,
          //   site: newSite._id,
          // });
        }
      }

      // Process attendances
      if (jsonData.attendances) {
        for (const attendanceData of jsonData.attendances) {
          const attendance = new AttendanceModel({
            ...attendanceData,
            site: newSite._id,
            markedBy: adminUser.userId,
            isPaid: true,
          });
          await attendance.save();
          savedAttendances.push(attendance._id);
          newSite.transactions.push({
            date: attendanceData.date,
            amount: -attendanceData.dailyWage,
            type: "attendance",
            description: `Attendance for employee ${attendanceData.employee}`,
            relatedId: attendance._id,
            user: adminUser.userId,
          });
          company.totalAmount -= attendanceData.dailyWage;
          company.transactions.push({
            date: attendanceData.date,
            amount: -attendanceData.dailyWage,
            type: "expenditure",
            description: `Attendance payment for site ${newSite.name}`,
            site: newSite._id,
          });
        }
      }

      // Process stock usages
      if (jsonData.stockUsages) {
        for (const usageData of jsonData.stockUsages) {
          const usage = new StockUsageModel({
            ...usageData,
            site: newSite._id,
            usedBy: adminUser.userId,
          });
          await usage.save();
          savedStockUsages.push(usage._id);
        }
      }

      // Process contractor transactions
      if (jsonData.contractorTransactions) {
        for (const transactionData of jsonData.contractorTransactions) {
          const transaction = new ContractorTransactionModel({
            ...transactionData,
            site: newSite._id,
            createdBy: adminUser.userId,
          });
          await transaction.save();
          savedContractorTransactions.push(transaction._id);
          newSite.transactions.push({
            date: transactionData.date || new Date(),
            amount: -transactionData.amount,
            type: "contractor_payment",
            description: transactionData.description || "Contractor payment",
            relatedId: transaction._id,
            user: adminUser.userId,
          });
          company.totalAmount -= transactionData.amount;
          company.transactions.push({
            date: transactionData.date || new Date(),
            amount: -transactionData.amount,
            type: "expenditure",
            description: `Contractor payment for site ${newSite.name}`,
            site: newSite._id,
          });
        }
      }

      // Save updated site and company
      await newSite.save();
      await company.save();

      // Log the activity
      await ActivityLogModel.create({
        user: adminUser.userId,
        action: "create_site_with_bulk_data",
        resource: "site",
        resourceId: newSite._id,
        details: `New site ${newSite.name} created with bulk data`,
      });

      res.status(HttpStatus.CREATED).json({
        message: "Site created successfully with bulk data",
        siteId: newSite._id,
      });
    } catch (error) {
      // Cleanup on error
      await SiteModel.findByIdAndDelete(newSite._id);
      if (savedPurchases.length > 0) {
        await PurchaseModel.deleteMany({ _id: { $in: savedPurchases } });
      }
      if (savedRentals.length > 0) {
        await MachineryRentalModel.deleteMany({ _id: { $in: savedRentals } });
      }
      if (savedAttendances.length > 0) {
        await AttendanceModel.deleteMany({ _id: { $in: savedAttendances } });
      }
      if (savedStockUsages.length > 0) {
        await StockUsageModel.deleteMany({ _id: { $in: savedStockUsages } });
      }
      if (savedContractorTransactions.length > 0) {
        await ContractorTransactionModel.deleteMany({
          _id: { $in: savedContractorTransactions },
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export default {
  initializeComapny,
  getDashboardData,
  getAllActivityLogs,
  createSiteWithBulkData,
};
