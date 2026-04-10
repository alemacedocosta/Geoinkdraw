import { Timestamp } from 'firebase/firestore';

export interface Point {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Drawing {
  id: string;
  creatorUid: string;
  creatorName: string;
  creatorPhoto?: string;
  title?: string;
  path: Point[];
  likesCount: number;
  createdAt: Timestamp;
  monthKey: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'blocked' | 'pending';
  trophyLevel: number;
  totalDrawings: number;
  createdAt: Timestamp;
}

export interface Invitation {
  id: string;
  email: string;
  invitedBy: string;
  createdAt: Timestamp;
  status: 'pending' | 'used';
}
