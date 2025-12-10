/**
 * Types pour le suivi des trajets commerciaux
 */

import { Trip, TripCheckpoint, Visit, TripStatus, VisitStatus, TripPurpose } from '@prisma/client';

// ========================================
// REQUEST TYPES - Trip
// ========================================

export interface StartTripRequest {
  purpose: TripPurpose;
  objective?: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  estimatedKm?: number;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface EndTripRequest {
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
  photos?: string[];
}

export interface UpdateTripRequest {
  purpose?: TripPurpose;
  objective?: string;
  vehicleType?: string;
  vehicleRegistration?: string;
  notes?: string;
  photos?: string[];
  hasReceipts?: boolean;
  receiptAmount?: number;
}

// ========================================
// REQUEST TYPES - Visit
// ========================================

export interface CreateVisitRequest {
  tripId: string;
  customerId?: string;
  purpose?: TripPurpose;
  scheduledAt?: Date;
  objective?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface CheckInVisitRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CheckOutVisitRequest {
  latitude?: number;
  longitude?: number;
  address?: string;
  summary: string;
  outcome?: string;
  photos?: string[];
  documents?: string[];
  signature?: string;
  satisfactionScore?: number;
  nextVisitDate?: Date;
  followUpNotes?: string;
}

export interface UpdateVisitRequest {
  customerId?: string;
  purpose?: TripPurpose;
  scheduledAt?: Date;
  objective?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  summary?: string;
  outcome?: string;
  photos?: string[];
  documents?: string[];
  satisfactionScore?: number;
  nextVisitDate?: Date;
  followUpNotes?: string;
}

// ========================================
// REQUEST TYPES - Checkpoint
// ========================================

export interface AddCheckpointRequest {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  speed?: number;
  heading?: number;
}

// ========================================
// RESPONSE TYPES
// ========================================

export interface TripWithDetails extends Trip {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  checkpoints: TripCheckpoint[];
  visits: VisitWithCustomer[];
}

export interface VisitWithCustomer extends Visit {
  customer?: {
    id: string;
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
  };
}

// ========================================
// STATS & REPORTS
// ========================================

export interface TripStats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalCost: number;
  averageDistancePerTrip: number;
  averageDurationPerTrip: number;
  tripsByPurpose: {
    purpose: TripPurpose;
    count: number;
    totalDistance: number;
    totalCost: number;
  }[];
}

export interface VisitStats {
  totalVisits: number;
  completedVisits: number;
  plannedVisits: number;
  noShowVisits: number;
  averageDuration: number;
  averageSatisfactionScore: number;
  visitsByPurpose: {
    purpose: TripPurpose;
    count: number;
  }[];
}

export interface UserTripSummary {
  userId: string;
  userName: string;
  totalTrips: number;
  totalDistanceKm: number;
  totalCost: number;
  totalVisits: number;
  pendingValidation: number;
  pendingReimbursement: number;
}

// ========================================
// FILTERS & QUERIES
// ========================================

export interface TripFilters {
  userId?: string;
  status?: TripStatus;
  purpose?: TripPurpose;
  startDate?: Date;
  endDate?: Date;
  isValidated?: boolean;
  isReimbursed?: boolean;
  minDistance?: number;
  maxDistance?: number;
}

export interface VisitFilters {
  tripId?: string;
  customerId?: string;
  status?: VisitStatus;
  purpose?: TripPurpose;
  startDate?: Date;
  endDate?: Date;
  minSatisfaction?: number;
  maxSatisfaction?: number;
}

// ========================================
// VALIDATION & REIMBURSEMENT
// ========================================

export interface ValidateTripRequest {
  approved: boolean;
  notes?: string;
  adjustedDistance?: number;
  adjustedCost?: number;
}

export interface ReimburseTripRequest {
  amount: number;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
}

// ========================================
// EXPORT
// ========================================

export interface TripExportData {
  trips: TripWithDetails[];
  exportDate: Date;
  exportedBy: string;
  filters?: TripFilters;
}
