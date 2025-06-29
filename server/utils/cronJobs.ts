import cron from 'node-cron';
import { createMonthlySalaryAssignments } from '../services/salaryService';

export function setupCronJobs() {
  // On the 1st of Each Month at 00:00 IST
  cron.schedule('0 0 1 * *', createMonthlySalaryAssignments, {
    timezone: 'Asia/Kolkata' // Indian Standard Time (IST)
  });

  // for testing(per minute)
  //   cron.schedule("* * * * *", createMonthlySalaryAssignments, {
  //   timezone: "Asia/Kolkata",
  // });

  console.log('Cron job scheduled for salary assignments');
}