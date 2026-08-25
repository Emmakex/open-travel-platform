import type { ReservationAccommodationBooking, ReservationStatus } from "@/domain/booking/types";
import type { UserRole } from "@/domain/identity/types";
import type { CurrencyCode } from "@/domain/travel/types";

export type StaffRole = Extract<UserRole, "operator" | "admin">;

export interface ReservationStatusUpdate {
  reservationId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  status: ReservationStatus;
}

export interface OperationsAuditEvent {
  id: string;
  reservationId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  fromStatus: ReservationStatus;
  toStatus: ReservationStatus;
  occurredAt: string;
}

export type ReservationPriority = "low" | "normal" | "high" | "urgent";
export type ReservationOperationsField = "owner" | "priority" | "tags";

export interface ReservationOperationsState {
  reservationId: string;
  ownerStaffId?: string;
  ownerDisplayName?: string;
  priority: ReservationPriority;
  tags: string[];
  updatedAt?: string;
  updatedByStaffId?: string;
  updatedByDisplayName?: string;
}

export interface ReservationOperationsChange {
  field: ReservationOperationsField;
  before: string;
  after: string;
}

export interface ReservationOperationsEvent {
  id: string;
  reservationId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
  changes: ReservationOperationsChange[];
  occurredAt: string;
}

export interface ReservationInternalNote {
  id: string;
  reservationId: string;
  body: string;
  authorStaffId: string;
  authorRole: StaffRole;
  authorDisplayName: string;
  createdAt: string;
}

export interface UpdateReservationOperationsInput {
  reservationId: string;
  ownerStaffId?: string;
  priority: ReservationPriority;
  tags: string[];
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

export interface AddReservationInternalNoteInput {
  reservationId: string;
  body: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

export type OperationsTaskTargetType = "trip-reservation" | "service-reservation" | "customer";
export type OperationsTaskStatus = "open" | "in-progress" | "completed" | "cancelled";
export type OperationsTaskEventField = "status" | "assignee" | "dueDate";

export interface OperationsTask {
  id: string;
  targetType: OperationsTaskTargetType;
  targetId: string;
  title: string;
  details?: string;
  status: OperationsTaskStatus;
  dueDate?: string;
  assigneeStaffId?: string;
  assigneeDisplayName?: string;
  createdByStaffId: string;
  createdByDisplayName: string;
  createdByRole: StaffRole;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface OperationsTaskEventChange {
  field: OperationsTaskEventField;
  before: string;
  after: string;
}

export interface OperationsTaskEvent {
  id: string;
  taskId: string;
  targetType: OperationsTaskTargetType;
  targetId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
  changes: OperationsTaskEventChange[];
  occurredAt: string;
}

export interface OperationsTaskComment {
  id: string;
  taskId: string;
  body: string;
  authorStaffId: string;
  authorDisplayName: string;
  authorRole: StaffRole;
  createdAt: string;
}

export interface CreateOperationsTaskInput {
  targetType: OperationsTaskTargetType;
  targetId: string;
  title: string;
  details?: string;
  dueDate?: string;
  assigneeStaffId?: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

export interface UpdateOperationsTaskInput {
  taskId: string;
  status: OperationsTaskStatus;
  dueDate?: string;
  assigneeStaffId?: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

export interface AddOperationsTaskCommentInput {
  taskId: string;
  body: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

export type SupplierFulfilmentTargetType = "trip-reservation" | "service-reservation";
export type SupplierFulfilmentComponentType = "trip" | "accommodation" | "service";
export type SupplierFulfilmentStatus = "not-requested" | "requested" | "confirmed" | "rejected" | "cancelled";
export type SupplierFulfilmentEventField = "supplier" | "status" | "reference" | "cost" | "deadline";

export interface SupplierFulfilmentComponent {
  targetType: SupplierFulfilmentTargetType;
  targetId: string;
  componentType: SupplierFulfilmentComponentType;
  componentKey: string;
  componentLabel: string;
  customerCurrency: CurrencyCode;
}

export interface SupplierFulfilmentItem extends SupplierFulfilmentComponent {
  id: string;
  status: SupplierFulfilmentStatus;
  supplierName?: string;
  supplierReference?: string;
  supplierCost?: number;
  supplierCurrency?: CurrencyCode;
  deadline?: string;
  createdAt: string;
  createdByStaffId: string;
  createdByDisplayName: string;
  updatedAt?: string;
  updatedByStaffId?: string;
  updatedByDisplayName?: string;
  requestedAt?: string;
  confirmedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

export interface SupplierFulfilmentEventChange {
  field: SupplierFulfilmentEventField;
  before: string;
  after: string;
}

export interface SupplierFulfilmentEvent {
  id: string;
  fulfilmentId: string;
  targetType: SupplierFulfilmentTargetType;
  targetId: string;
  componentKey: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
  changes: SupplierFulfilmentEventChange[];
  occurredAt: string;
}

export interface SupplierFulfilmentNote {
  id: string;
  fulfilmentId: string;
  body: string;
  authorStaffId: string;
  authorDisplayName: string;
  authorRole: StaffRole;
  createdAt: string;
}

export interface SaveSupplierFulfilmentInput {
  targetType: SupplierFulfilmentTargetType;
  targetId: string;
  componentKey: string;
  status: SupplierFulfilmentStatus;
  supplierName?: string;
  supplierReference?: string;
  supplierCost?: number;
  supplierCurrency?: CurrencyCode;
  deadline?: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

export interface AddSupplierFulfilmentNoteInput {
  fulfilmentId: string;
  body: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  actorDisplayName: string;
}

export type ReservationAmendmentType = "traveller-correction" | "departure-change";
export type TravellerCorrectionField = "firstName" | "lastName" | "nationality";
export type DepartureChangeField =
  | "availabilityId"
  | "departureDate"
  | "returnDate"
  | "unitPrice"
  | "totalPrice"
  | "inventorySpaces"
  | "accommodationTotal"
  | "accommodationAdditionalTotal";
export type ReservationAmendmentField = TravellerCorrectionField | DepartureChangeField;

export interface ReservationAmendmentChange {
  field: ReservationAmendmentField;
  before: string;
  after: string;
}

export interface ReservationInventoryMovement {
  fromAvailabilityId: string;
  toAvailabilityId: string;
  releasedSpaces: number;
  reservedSpaces: number;
}

export interface ReservationAmendment {
  id: string;
  reservationId: string;
  type: ReservationAmendmentType;
  travellerId?: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  reason: string;
  changes: ReservationAmendmentChange[];
  priceDelta?: number;
  currency?: string;
  inventoryMovement?: ReservationInventoryMovement;
  /** Exact accommodation snapshots preserve the room allocation before and after a departure change. */
  accommodationBefore?: ReservationAccommodationBooking[];
  accommodationAfter?: ReservationAccommodationBooking[];
  occurredAt: string;
}

export interface TravellerCorrectionInput {
  reservationId: string;
  travellerId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  reason: string;
  firstName: string;
  lastName: string;
  nationality: string;
}

export interface DepartureChangeInput {
  reservationId: string;
  newAvailabilityId: string;
  actorIdentityId: string;
  actorRole: StaffRole;
  reason: string;
}

export interface OperationsSummary {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}
