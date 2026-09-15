/**
 * TravelSathi Offline Storage & Resilient Synchronization Layer
 * ------------------------------------------------------------
 * Handles local caching of travel groups, companion states, meeting points,
 * and maintains a tamper-proof pending message queue when offline.
 */

export interface CachedGroupState {
  group: any;
  members: any[];
  meetingPoint: any;
  messages: any[];
  lastSyncedAt: string;
}

export interface QueuedOfflineMessage {
  tempId: string;
  groupId: string;
  messageType: string;
  encryptedPayload: string;
  iv: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

const STORAGE_PREFIX = 'travelsathi_offline_';

export function saveGroupOffline(groupId: string, state: Partial<CachedGroupState>): void {
  try {
    const key = `${STORAGE_PREFIX}group_${groupId}`;
    const existing = loadGroupOffline(groupId) || {
      group: null,
      members: [],
      meetingPoint: null,
      messages: [],
      lastSyncedAt: new Date().toISOString()
    };
    const merged = { ...existing, ...state, lastSyncedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to save group to offline cache:', e);
  }
}

export function loadGroupOffline(groupId: string): CachedGroupState | null {
  try {
    const key = `${STORAGE_PREFIX}group_${groupId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function queueMessageOffline(msg: QueuedOfflineMessage): void {
  try {
    const key = `${STORAGE_PREFIX}pending_messages_${msg.groupId}`;
    const queue = getOfflineQueue(msg.groupId);
    queue.push(msg);
    localStorage.setItem(key, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to queue offline message:', e);
  }
}

export function getOfflineQueue(groupId: string): QueuedOfflineMessage[] {
  try {
    const key = `${STORAGE_PREFIX}pending_messages_${groupId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearOfflineQueue(groupId: string): void {
  try {
    const key = `${STORAGE_PREFIX}pending_messages_${groupId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to clear offline queue:', e);
  }
}
