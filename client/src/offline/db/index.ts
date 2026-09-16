import Dexie, { type Table } from "dexie";

export type SyncStatus = "synced" | "pending" | "failed" | "conflict";

export interface LocalSite {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  client?: any;
  status: string;
  phases: any[];
  budget: number;
  expenses: number;
  supervisionPercentage: number;
  transactions?: any[];
  documents?: any[];
  siteManagers?: any[];
  architects?: any[];
  supervisors?: any[];
  version?: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalAttendance {
  id: string; // generated client ID or server _id
  employeeId: string;
  employeeName?: string;
  employeePosition?: string;
  siteId: string;
  date: string; // YYYY-MM-DD
  status: number; // 0 to 1
  dailyWage: number;
  isPaid?: boolean;
  markedBy?: string;
  clientMutationId?: string;
  version?: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalPurchase {
  id: string;
  siteId?: string;
  vendorId: string;
  vendorName?: string;
  items: Array<{
    name: string;
    unit: string;
    category: string;
    quantity: number;
    price: number;
    totalAmount: number;
  }>;
  totalAmount: number;
  transportationFee: number;
  paymentMethod: "cash" | "credit";
  sourceOfFunds?: "company" | "siteManager";
  deductFromUserId?: string;
  notes?: string;
  date: string;
  status: "pending" | "verified";
  billFileBlob?: Blob;
  billFileName?: string;
  clientMutationId?: string;
  version?: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalMiscellaneousExpense {
  id: string;
  siteId: string;
  category: "machinery" | "rental" | "service" | "material";
  name: string;
  amount: number;
  tip?: number;
  notes?: string;
  date: string;
  paymentMethod: "cash" | "credit";
  sourceOfFunds?: "company" | "siteManager";
  deductFromUserId?: string;
  vendorId?: string;
  status: "pending" | "verified";
  clientMutationId?: string;
  version?: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalEmployee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  dailyWage: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalVendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface LocalItem {
  id: string;
  name: string;
  normalizedName: string;
  category?: string;
  defaultUnit?: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id?: number;
  clientMutationId: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entity: "attendance" | "purchases" | "miscellaneousExpenses" | "sites";
  recordId: string;
  payload: any;
  createdAt: string;
  attempts: number;
  status: "pending" | "processing" | "failed" | "conflict";
  lastError?: string;
}

export interface SyncMetadata {
  key: string;
  lastSyncTimestamp: string;
  status?: string;
}

export interface ConflictRecord {
  id: string;
  clientMutationId: string;
  entity: string;
  recordId: string;
  clientPayload: any;
  serverPayload?: any;
  reason: string;
  createdAt: string;
  resolved: boolean;
}

export class SimakDexieDB extends Dexie {
  sites!: Table<LocalSite, string>;
  attendance!: Table<LocalAttendance, string>;
  purchases!: Table<LocalPurchase, string>;
  miscellaneousExpenses!: Table<LocalMiscellaneousExpense, string>;
  employees!: Table<LocalEmployee, string>;
  vendors!: Table<LocalVendor, string>;
  items!: Table<LocalItem, string>;
  sync_queue!: Table<SyncQueueItem, number>;
  sync_metadata!: Table<SyncMetadata, string>;
  conflicts!: Table<ConflictRecord, string>;

  constructor() {
    super("SimakOfflineDB");

    this.version(1).stores({
      sites: "id, name, status, updatedAt, syncStatus",
      attendance: "id, employeeId, siteId, date, status, updatedAt, syncStatus, [siteId+date]",
      purchases: "id, siteId, vendorId, date, status, updatedAt, syncStatus",
      miscellaneousExpenses: "id, siteId, category, date, status, updatedAt, syncStatus",
      employees: "id, name, position, dailyWage, updatedAt, syncStatus",
      vendors: "id, name, phone, email, updatedAt, syncStatus",
      items: "id, normalizedName, category, updatedAt, syncStatus",
      sync_queue: "++id, clientMutationId, operation, entity, recordId, createdAt, attempts, status",
      sync_metadata: "key, lastSyncTimestamp, status",
      conflicts: "id, clientMutationId, entity, recordId, createdAt, resolved",
    });
  }
}

export const offlineDB = new SimakDexieDB();
