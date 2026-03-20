import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';
export type TaskType = 'duty' | 'task' | 'shopping';
export type TaskStatus = 'pending' | 'completed';
export type EventStatus = 'planned' | 'happened' | 'cancelled';
export type TransactionType = 'deposit' | 'withdrawal';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  xp: number;
  level: string;
  role: UserRole;
  totalContributed?: number;
  tasksCompleted?: number;
}

export interface Transaction {
  id?: string;
  userId: string;
  userName: string;
  amount: number;
  type: TransactionType;
  comment?: string;
  timestamp: Timestamp;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  status: TaskStatus;
  type: TaskType;
  xpReward: number;
  deadline?: Timestamp;
  price?: number;
  completedBy?: string;
  completedAt?: Timestamp;
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  time: Timestamp;
  location?: string;
  creatorUid: string;
  participants: string[];
  status: EventStatus;
}

export interface StorageItem {
  id?: string;
  ownerName: string;
  itemName: string;
  location: string;
  timestamp: Timestamp;
}
