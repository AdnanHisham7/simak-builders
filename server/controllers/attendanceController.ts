import { Request, Response, NextFunction } from "express";
import { AttendanceModel } from "@models/Attendance";
import { SiteModel } from "@models/Site";
import { EmployeeModel } from "@models/Employee"; // Added
import { UserRole } from "@entities/user";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import mongoose from "mongoose";

const markAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId, siteId, date, status } = req.body;
    const user = req.user;

    if (typeof status !== "number" || status < 0 || status > 1) {
      throw new ApiError(
        "Status must be a number between 0 and 1",
        HttpStatus.BAD_REQUEST
      );
    }

    const employee = await EmployeeModel.findById(employeeId);
    if (!employee)
      throw new ApiError("Employee not found", HttpStatus.NOT_FOUND);

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    const existing = await AttendanceModel.findOne({
      employee: employeeId,
      site: siteId,
      date,
    });
    if (existing)
      throw new ApiError("Attendance already marked", HttpStatus.FORBIDDEN);

    const attendance = new AttendanceModel({
      employee: employeeId,
      site: siteId,
      date,
      status,
      dailyWage: employee.dailyWage,
      isPaid: false,
      markedBy: req.user?.userId,
    });
    await attendance.save();

    const expense = status * employee.dailyWage;
    await SiteModel.findByIdAndUpdate(siteId, { $inc: { expenses: expense } });
    site.transactions.push({
      date: new Date(),
      amount: expense,
      type: "attendance",
      description: `Attendance for ${employee.name}`,
      relatedId: attendance._id,
      user: user.userId,
    });
    await site.save();

    res
      .status(HttpStatus.CREATED)
      .json({ message: "Attendance marked", attendanceId: attendance._id });
  } catch (error) {
    next(error);
  }
};

const getSiteAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId } = req.params;
    const { startDate, endDate } = req.query;

    const site = await SiteModel.findById(siteId);
    if (!site) throw new ApiError("Site not found", HttpStatus.NOT_FOUND);

    if (!startDate || !endDate) {
      throw new ApiError(
        "Start and end dates are required",
        HttpStatus.BAD_REQUEST
      );
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError("Invalid date format", HttpStatus.BAD_REQUEST);
    }

    const attendanceRecords = await AttendanceModel.aggregate([
      {
        $match: {
          site: new mongoose.Types.ObjectId(siteId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalEffectiveAttendance: { $sum: "$status" },
          totalEmployees: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const attendanceData = attendanceRecords.map((record) => ({
      date: record._id,
      totalEffectiveAttendance: record.totalEffectiveAttendance,
      totalEmployees: record.totalEmployees,
      percentage:
        record.totalEmployees > 0
          ? (record.totalEffectiveAttendance / record.totalEmployees) * 100
          : 0,
    }));

    res.status(HttpStatus.OK).json(attendanceData);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceDetailsForDay = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId, date } = req.params;
    const attendanceRecords = await AttendanceModel.find({
      site: siteId,
      date: new Date(date),
    }).populate("employee", "name");

    const formattedRecords = attendanceRecords.map((record) => ({
      employeeId: record.employee._id,
      employeeName: record.employee.name,
      status: record.status,
    }));

    res.status(HttpStatus.OK).json(formattedRecords);
  } catch (error) {
    next(error);
  }
};

export const getEmployeesWithAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { siteId, date } = req.params;
    const attendanceRecords = await AttendanceModel.find({
      site: siteId,
      date: new Date(date),
    }).select("employee");

    const employeeIds = attendanceRecords.map((record) =>
      record.employee.toString()
    );
    res.status(HttpStatus.OK).json(employeeIds);
  } catch (error) {
    next(error);
  }
};

export default {
  markAttendance,
  getSiteAttendance,
  getAttendanceDetailsForDay,
  getEmployeesWithAttendance,
};
