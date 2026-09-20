import cron from "node-cron";
import { StockModel } from "@models/Stock";
import { UserModel } from "@models/User";
import { NotificationModel } from "@models/Notification";

interface StockAlertResult {
  checkedCount: number;
  alertedCount: number;
  lowStockItems: Array<{
    stockId: any;
    name: string;
    quantity: number;
    unit: string;
    threshold: number;
    siteName: string;
    urgency: "critical" | "low";
  }>;
}

export const checkLowStockAcrossSites = async (isManual = false): Promise<StockAlertResult> => {
  try {
    // Find all stocks where quantity is less than or equal to their lowStockThreshold (or fallback 10)
    const stocks = await StockModel.find({
      $expr: {
        $lte: ["$quantity", { $ifNull: ["$lowStockThreshold", 10] }],
      },
    }).populate("site", "name").lean();

    const lowStockItems: StockAlertResult["lowStockItems"] = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const admins = await UserModel.find({ role: "admin" }, "_id").lean();

    let alertedCount = 0;

    for (const stock of stocks) {
      const threshold = stock.lowStockThreshold ?? 10;
      const urgency = stock.quantity <= 0 ? "critical" : "low";
      const siteName = (stock.site as any)?.name || "Main Inventory";

      lowStockItems.push({
        stockId: stock._id,
        name: stock.name,
        quantity: stock.quantity,
        unit: stock.unit,
        threshold,
        siteName,
        urgency,
      });

      // Throttle: avoid spamming notification if alert was already sent in last 24h (unless manual check)
      if (!isManual && stock.lastAlertSentAt && new Date(stock.lastAlertSentAt) > oneDayAgo) {
        continue;
      }

      // Collect target recipients: site managers for this site + admins
      const recipients = new Set<string>();
      admins.forEach((a) => recipients.add(String(a._id)));

      if (stock.site) {
        const siteManagers = await UserModel.find(
          { role: "siteManager", assignedSites: (stock.site as any)._id || stock.site },
          "_id"
        ).lean();
        siteManagers.forEach((sm) => recipients.add(String(sm._id)));
      }

      const alertPrefix = urgency === "critical" ? "⚠️ CRITICAL OUT OF STOCK" : "🔔 LOW STOCK REORDER ALERT";
      const message = `${alertPrefix}: "${stock.name}" at site "${siteName}" is down to ${stock.quantity} ${stock.unit} (reorder threshold is ${threshold} ${stock.unit}). Please reorder or arrange transfer.`;

      for (const recipientId of recipients) {
        await NotificationModel.create({
          user: recipientId,
          type: "low_stock_alert",
          status: "pending",
          relatedId: stock._id,
          message,
          metadata: {
            stockId: stock._id,
            stockName: stock.name,
            siteId: (stock.site as any)?._id || stock.site,
            siteName,
            category: stock.category,
            unit: stock.unit,
            quantity: stock.quantity,
            threshold,
          },
        });
      }

      await StockModel.findByIdAndUpdate(stock._id, {
        lastAlertSentAt: new Date(),
      });
      alertedCount += 1;
    }

    return {
      checkedCount: stocks.length,
      alertedCount,
      lowStockItems,
    };
  } catch (error) {
    console.error("Error running stock reorder check:", error);
    throw error;
  }
};

export const initStockAlertCron = () => {
  // Run daily at 08:00 AM (0 8 * * *)
  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Running daily scheduled stock reorder check...");
    try {
      const result = await checkLowStockAcrossSites(false);
      console.log(
        `[CRON] Stock reorder check completed: ${result.checkedCount} items below threshold, ${result.alertedCount} alerts dispatched.`
      );
    } catch (err) {
      console.error("[CRON] Scheduled stock reorder check failed:", err);
    }
  });

  console.log("[CRON] Stock reorder alert cron initialized (schedule: 0 8 * * *).");
};
