import { UserModel } from '@models/User'; // Adjust the import path to your User model

export async function createMonthlySalaryAssignments() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11 (January is 0)
    const currentYear = now.getFullYear();

    // Define roles that receive fixed salaries (adjust as per your application)
    const allowedRoles = ['siteManager', 'supervisor', 'architect'];

    // Find users with a fixed salary
    const users = await UserModel.find({
      role: { $in: allowedRoles },
      fixedSalary: { $gt: 0 }
    });
    console.log(users, "this is working as f")

    for (const user of users) {
      // Check if an assignment already exists for this month
      const hasAssignmentThisMonth = user.salaryAssignments.some(sa => {
        const saDate = new Date(sa.date);
        return (
          saDate.getMonth() === currentMonth &&
          saDate.getFullYear() === currentYear
        );
      });

      if (!hasAssignmentThisMonth) {
        // Create a new salary assignment
        const newAssignment = {
          date: now,
          givenBy: null, // Indicates an automated assignment (or use a system user ID)
          amount: user.fixedSalary,
          isVerified: false
        };

        // Add the assignment to the user's salaryAssignments array
        user.salaryAssignments.push(newAssignment);
        await user.save();

        console.log(`Created salary assignment for ${user.name}`);
      }
    }
  } catch (error) {
    console.error('Error in createMonthlySalaryAssignments:', error);
    // Add additional error handling (e.g., notifications) as needed
  }
}