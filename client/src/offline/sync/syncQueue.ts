import { offlineDB, SyncQueueItem } from "../db";

export const generateClientId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const enqueueMutation = async (
  entity: SyncQueueItem["entity"],
  operation: SyncQueueItem["operation"],
  recordId: string,
  payload: any
): Promise<string> => {
  const clientMutationId = `mut-${generateClientId()}`;

  const item: SyncQueueItem = {
    clientMutationId,
    operation,
    entity,
    recordId,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: "pending",
  };

  await offlineDB.sync_queue.add(item);
  return clientMutationId;
};

export const getPendingMutations = async (): Promise<SyncQueueItem[]> => {
  return offlineDB.sync_queue
    .where("status")
    .anyOf(["pending", "failed"])
    .sortBy("createdAt");
};

export const getPendingCount = async (): Promise<number> => {
  return offlineDB.sync_queue
    .where("status")
    .anyOf(["pending", "failed"])
    .count();
};

export const markMutationProcessing = async (id: number): Promise<void> => {
  await offlineDB.sync_queue.update(id, { status: "processing" });
};

export const markMutationSuccess = async (id: number): Promise<void> => {
  await offlineDB.sync_queue.delete(id);
};

export const markMutationFailed = async (
  id: number,
  error: string,
  currentAttempts: number
): Promise<void> => {
  await offlineDB.sync_queue.update(id, {
    status: "failed",
    attempts: currentAttempts + 1,
    lastError: error,
  });
};

export const markMutationConflict = async (
  id: number,
  error: string
): Promise<void> => {
  await offlineDB.sync_queue.update(id, {
    status: "conflict",
    lastError: error,
  });
};

export const clearSyncQueue = async (): Promise<void> => {
  await offlineDB.sync_queue.clear();
};
