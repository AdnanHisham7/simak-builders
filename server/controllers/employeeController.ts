import { Request, Response, NextFunction } from "express";
import { EmployeeModel } from "@models/Employee";
import { HttpStatus } from "@utils/enums/httpStatus";
import { ApiError } from "@utils/errors/ApiError";
import { AttendanceModel } from "@models/Attendance";
import { ActivityLogModel } from "@models/ActivityLog";

const getEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employees = await EmployeeModel.aggregate([
      // Step 1: Lookup paid attendance records for each employee
      {
        $lookup: {
          from: "attendances",
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employee", "$$employeeId"] },
                    { $eq: ["$isPaid", true] },
                  ],
                },
              },
            },
          ],
          as: "paidAttendances",
        },
      },
      // Step 2: Calculate total paid salary
      {
        $addFields: {
          totalPaidSalary: {
            $sum: {
              $map: {
                input: "$paidAttendances",
                as: "att",
                in: { $multiply: ["$$att.status", "$$att.dailyWage"] },
              },
            },
          },
        },
      },
      // Step 3: Exclude the paidAttendances array from the response
      {
        $project: {
          paidAttendances: 0,
        },
      },
    ]);

    res.status(HttpStatus.OK).json(employees);
  } catch (error) {
    next(error);
  }
};  

const getEmployeeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const employee = await EmployeeModel.findById(id);
    if (!employee)
      throw new ApiError("Employee not found", HttpStatus.NOT_FOUND);
    res.status(HttpStatus.OK).json(employee);
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, phone, position, dailyWage } = req.body;
    if (!name || !email || !phone || !position || dailyWage === undefined) {
      throw new ApiError("Missing required fields", HttpStatus.BAD_REQUEST);
    }
    const newEmployee = await EmployeeModel.create({
      name,
      email,
      phone,
      position,
      dailyWage,
    });

    await ActivityLogModel.create({
      user: req.user?.userId,
      action: "create",
      resource: "employee",
      resourceId: newEmployee._id,
      details: `Created employee: ${newEmployee.name}`,
    });

    res.status(HttpStatus.CREATED).json(newEmployee);
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, dailyWage } = req.body;

    // Fetch the current employee to get the existing dailyWage
    const employee = await EmployeeModel.findById(id);
    if (!employee) throw new ApiError("Employee not found", HttpStatus.NOT_FOUND);
    const oldDailyWage = employee.dailyWage;

    // Update the employee with the provided fields
    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      id,
      { name, email, phone, position, dailyWage },
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) throw new ApiError("Employee not found", HttpStatus.NOT_FOUND);

    // Check if dailyWage has changed and update attendance records if necessary
    if (oldDailyWage !== updatedEmployee.dailyWage) {
      await AttendanceModel.updateMany(
        { employee: id, isPaid: false },
        { dailyWage: updatedEmployee.dailyWage }
      );
    }

    res.status(HttpStatus.OK).json(updatedEmployee);
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedEmployee = await EmployeeModel.findByIdAndDelete(id);
    if (!deletedEmployee)
      throw new ApiError("Employee not found", HttpStatus.NOT_FOUND);
    res.status(HttpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

const getAttendanceByEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const attendanceRecords = await AttendanceModel.find({ employee: id })
      .populate("site", "name")
      .populate("markedBy", "name")
      .sort({ date: -1 });
    res.status(HttpStatus.OK).json(attendanceRecords);
  } catch (error) {
    next(error);
  }
};

const calculateSalary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId, startDate, endDate } = req.body;
    const attendances = await AttendanceModel.find({
      employee: employeeId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      isPaid: false,
    });
    const totalSalary = attendances.reduce(
      (sum, att) => sum + att.status * att.dailyWage,
      0
    );
    const attendanceIds = attendances.map((att) => att._id);
    res.status(HttpStatus.OK).json({ totalSalary, attendanceIds });
  } catch (error) {
    next(error);
  }
};

const markAttendancesPaid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attendanceIds } = req.body;
    await AttendanceModel.updateMany(
      { _id: { $in: attendanceIds } },
      { isPaid: true }
    );
    res.status(HttpStatus.OK).json({ message: "Attendances marked as paid" });
  } catch (error) {
    next(error);
  }
};

export default {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAttendanceByEmployee,
  calculateSalary,
  markAttendancesPaid,
};
