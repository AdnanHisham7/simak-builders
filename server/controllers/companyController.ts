import { Request, Response, NextFunction } from "express";
import { CompanyModel } from "@models/Company";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ClientTransactionModel } from "@models/ClientTransaction";
import { EmployeeModel } from "@models/Employee";
import { SiteModel } from "@models/Site";
import { StockModel } from "@models/Stock";
import { AttendanceModel } from "@models/Attendance";
import { ActivityLogModel } from "@models/ActivityLog";
import { UserModel } from "@models/User";
import { VendorModel } from "@models/Vendor";
import { ContractorModel } from "@models/Contractor";
import upload from "@middleware/multer";
import cloudinary from "../services/cloudinaryService";
import Joi from "joi";
import mongoose, { startSession, Types } from "mongoose";
import { PurchaseModel } from "@models/Purchase";
import { MiscellaneousExpenseModel } from "@models/MiscellaneousExpense";
import { StockUsageModel } from "@models/StockUsage";
import { ContractorTransactionModel } from "@models/ContractorTransaction";

const initializeComapny = async (
  req: Request,
  res: Response,
  next: NextFunction,
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
  next: NextFunction,
) => {
  try {
    const totalEmployees = await EmployeeModel.countDocuments();
    const totalSites = await SiteModel.countDocuments();
    const totalStocks = await StockModel.countDocuments();

    const now = new Date();
    const startOfCurrentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );

    const [employeesLastMonth, sitesLastMonth, stocksLastMonth] =
      await Promise.all([
        EmployeeModel.countDocuments({
          createdAt: { $lt: startOfCurrentMonth },
        }),
        SiteModel.countDocuments({
          createdAt: { $lt: startOfCurrentMonth },
        }),
        StockModel.countDocuments({
          createdAt: { $lt: startOfCurrentMonth },
        }),
      ]);

    const clientsCount = await UserModel.countDocuments({
      role: "client",
      isBlocked: false,
      isDeleted: { $ne: true },
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
      })),
    );

    const pendingTransactions = await ClientTransactionModel.find({
      status: "pending",
    }).populate("client", "name email");

    const sites = await SiteModel.find().select("name phases");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const sitePerformance = await Promise.all(
      sites.map(async (site) => {
        const completedPhases = site.phases.filter(
          (phase) => phase.status === "completed",
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
          0,
        );
        const averageAttendance =
          attendances.length > 0 ? totalAttendance / attendances.length : 0;
        const utilization = averageAttendance * 100;

        return {
          name: site.name,
          efficiency: Math.round(efficiency),
          utilization: Math.round(utilization),
        };
      }),
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
          new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime(),
      )
      .slice(0, 5);

    res.status(HttpStatus.OK).json({
      totalEmployees,
      totalSites,
      totalStocks,
      employeesLastMonth,
      sitesLastMonth,
      stocksLastMonth,
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
  next: NextFunction,
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
  next: NextFunction,
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
          }),
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
                }),
              )
              .required(),
            totalAmount: Joi.number().required(),
          }),
        )
        .optional(),
      miscellaneousExpenses: Joi.array()
        .items(
          Joi.object({
            category: Joi.string()
              .valid("machinery", "rental", "service", "material")
              .required(),
            name: Joi.string().required(),
            amount: Joi.number().required(),
            tip: Joi.number().optional().default(0),
            notes: Joi.string().optional().allow("").default(""),
            date: Joi.date().required(),
          }).unknown(true),
        )
        .optional(),
      attendances: Joi.array()
        .items(
          Joi.object({
            employee: Joi.string().required(),
            date: Joi.date().required(),
            status: Joi.number().min(0).max(1).required(),
            dailyWage: Joi.number().required(),
          }),
        )
        .optional(),
      stockUsages: Joi.array()
        .items(
          Joi.object({
            stock: Joi.string().required(),
            quantity: Joi.number().required(),
            usageDate: Joi.date(),
          }),
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
          }),
        )
        .optional(),
    });

    const { error } = schema.validate(jsonData);
    if (error) {
      throw new ApiError(
        `Validation error: ${error.details[0].message}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let totalExpenditure = 0;
    if (jsonData.purchases) {
      totalExpenditure += jsonData.purchases.reduce(
        (sum: any, p: { totalAmount: any }) => sum + p.totalAmount,
        0,
      );
    }
    if (jsonData.miscellaneousExpenses) {
      totalExpenditure += jsonData.miscellaneousExpenses.reduce(
        (sum: any, exp: any) => sum + exp.amount + (exp.tip || 0),
        0,
      );
    }
    if (jsonData.attendances) {
      totalExpenditure += jsonData.attendances.reduce(
        (sum: any, a: { dailyWage: any }) => sum + a.dailyWage,
        0,
      );
    }
    if (jsonData.contractorTransactions) {
      totalExpenditure += jsonData.contractorTransactions.reduce(
        (sum: any, t: { amount: any }) => sum + t.amount,
        0,
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
    const savedExpenses = [];
    const savedAttendances = [];
    const savedStockUsages = [];
    const savedContractorTransactions = [];

    try {
      // Process documents from uploaded files
      const documentFiles = files.filter((f) =>
        f.fieldname.startsWith("documents["),
      );
      for (const docFile of documentFiles) {
        const document = {
          name: docFile.originalname,
          size: docFile.size,
          type: docFile.mimetype,
          url: docFile.path,
          public_id: docFile.filename,
          uploadedBy: new Types.ObjectId(adminUser.userId),
          uploadDate: new Date(),
          category: "site" as const,
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
              url: billFile.path,
              public_id: billFile.filename,
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
            relatedId: new Types.ObjectId(purchase._id),
            user: new Types.ObjectId(adminUser.userId),
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

      // Process Miscellaneous Expenses
      if (jsonData.miscellaneousExpenses) {
        for (const expData of jsonData.miscellaneousExpenses) {
          const totalAmount = expData.amount + (expData.tip || 0);

          const expense = new MiscellaneousExpenseModel({
            site: newSite._id,
            category: expData.category,
            name: expData.name,
            amount: expData.amount,
            tip: expData.tip || 0,
            notes: expData.notes || "",
            date: expData.date,
            addedBy: adminUser.userId,
            status: "verified", // bulk import by admin → auto verified
          });
          await expense.save();
          savedExpenses.push(expense._id);

          newSite.transactions.push({
            date: new Date(expData.date),
            amount: totalAmount,
            type: "miscellaneous",
            description: `${expData.category} - ${expData.name}`,
            relatedId: expense._id,
            user: new Types.ObjectId(adminUser.userId),
          });

          newSite.expenses += totalAmount;
          newSite.budget -= totalAmount;
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
            relatedId: new Types.ObjectId(attendance._id),
            user: new Types.ObjectId(adminUser.userId),
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
            relatedId: new Types.ObjectId(transaction._id),
            user: new Types.ObjectId(adminUser.userId),
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
      if (savedExpenses.length > 0)
        await MiscellaneousExpenseModel.deleteMany({
          _id: { $in: savedExpenses },
        });
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

const getCompanySummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company = await CompanyModel.findOne().populate(
      "transactions.site",
      "name",
    );
    if (!company) {
      throw new ApiError("Company not found", HttpStatus.NOT_FOUND);
    }
    const sortedTransactions = [...company.transactions].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    res.status(HttpStatus.OK).json({
      totalAmount: company.totalAmount,
      transactions: sortedTransactions,
    });
  } catch (error) {
    next(error);
  }
};

const addCompanyFunds = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }
    const { amount, notes } = req.body;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new ApiError(
        "Amount must be greater than zero",
        HttpStatus.BAD_REQUEST,
      );
    }

    const company = await CompanyModel.findOne();
    if (!company) {
      throw new ApiError("Company not found", HttpStatus.NOT_FOUND);
    }

    company.totalAmount += numAmount;
    company.transactions.push({
      date: new Date(),
      amount: numAmount,
      type: "incoming",
      description: notes ? String(notes).trim() : "Funds added to company",
    });
    await company.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "company",
      resourceId: company._id,
      details: `Added ${numAmount} to company funds`,
    });

    res.status(HttpStatus.CREATED).json({
      message: "Funds added successfully",
      totalAmount: company.totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let company = await CompanyModel.findOne();
    if (!company) {
      company = await CompanyModel.create({ totalAmount: 0 });
    }
    const isRequesterAdmin = req.user?.role === "admin";
    res.status(HttpStatus.OK).json({
      id: company._id,
      name: company.name || "",
      logo: company.logo || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zip: company.zip || "",
      country: company.country || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      description: company.description || "",
      ...(isRequesterAdmin ? { taxId: company.taxId || "" } : {}),
    });
  } catch (error) {
    next(error);
  }
};

const COMPANY_PROFILE_TEXT_FIELDS = [
  "name",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "phone",
  "email",
  "website",
  "taxId",
  "description",
] as const;

const updateCompanyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.role !== "admin") {
      throw new ApiError("Unauthorized", HttpStatus.FORBIDDEN);
    }

    let company = await CompanyModel.findOne();
    if (!company) {
      company = new CompanyModel({ totalAmount: 0 });
    }

    for (const field of COMPANY_PROFILE_TEXT_FIELDS) {
      const value = (req.body as Record<string, unknown>)[field];
      if (value !== undefined) {
        (company as any)[field] = String(value).trim().slice(0, 500);
      }
    }

    if (req.file) {
      const previousPublicId = company.logoPublicId;
      company.logo = (req.file as Express.Multer.File).path;
      company.logoPublicId = (req.file as Express.Multer.File).filename;
      if (previousPublicId) {
        try {
          await cloudinary.uploader.destroy(previousPublicId);
        } catch (error) {
          // Non-fatal: stale asset can be cleaned up manually.
        }
      }
    }

    await company.save();

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "update",
      resource: "company_profile",
      resourceId: company._id,
      details: "Updated company profile",
    });

    res.status(HttpStatus.OK).json({
      message: "Company profile updated successfully",
      company: {
        id: company._id,
        name: company.name || "",
        logo: company.logo || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        zip: company.zip || "",
        country: company.country || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        taxId: company.taxId || "",
        description: company.description || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAmountToBeReceived = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sites = await SiteModel.find()
      .select("name expenses client")
      .populate("client", "name");

    const receivedBySite = await ClientTransactionModel.aggregate([
      { $match: { status: "verified", site: { $ne: null } } }, // 1. Prevents null sites from aggregating
      { $group: { _id: "$site", totalReceived: { $sum: "$amount" } } },
    ]);
    
    const receivedMap = new Map(
      receivedBySite.map((r: any) => [r._id?.toString(), r.totalReceived]), // 2. Optional chaining fallback
    );

    const bySite = sites.map((site: any) => {
      // 3. Optional chaining fallback just in case a site lacks an _id
      const amountReceived = receivedMap.get(site._id?.toString()) || 0; 
      const difference = (site.expenses || 0) - amountReceived;
      return {
        siteId: site._id,
        siteName: site.name,
        clientName: site.client?.name || "Unassigned",
        expenses: site.expenses || 0,
        amountReceived,
        amountToBeReceived: difference,
      };
    });

    const total = bySite.reduce((sum, s) => sum + s.amountToBeReceived, 0);

    res.status(HttpStatus.OK).json({ total, bySite });
  } catch (error) {
    next(error);
  }
};

export default {
  initializeComapny,
  getDashboardData,
  getAllActivityLogs,
  createSiteWithBulkData,
  getCompanySummary,
  addCompanyFunds,
  getAmountToBeReceived,
  getCompanyProfile,
  updateCompanyProfile,
};