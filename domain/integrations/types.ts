export type IntegrationEventType =
  | "trip.reservation.created"
  | "trip.reservation.status.changed"
  | "service.reservation.created"
  | "service.reservation.status.changed";

export type IntegrationDeliveryStatus =
  | "pending"
  | "delivering"
  | "retrying"
  | "succeeded"
  | "dead-letter";

export type IntegrationEndpointSummary = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  subscribedEvents: IntegrationEventType[];
  secretConfigured: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type IntegrationEventEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  type: IntegrationEventType;
  version: 1;
  occurredAt: string;
  aggregateType: "trip-reservation" | "service-reservation";
  aggregateId: string;
  payload: TPayload;
};

export type IntegrationDelivery = {
  id: string;
  eventId: string;
  endpointId: string;
  status: IntegrationDeliveryStatus;
  attempts: number;
  nextAttemptAt: string;
  lastAttemptAt?: string;
  leaseUntil?: string;
  responseStatus?: number;
  lastError?: string;
  succeededAt?: string;
  deadLetteredAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type TripReservationCreatedPayload = {
  reservationId: string;
  tripId: string;
  availabilityId: string;
  status: string;
  partySize: number;
  totalPrice: number;
  currency: string;
  departureDate?: string;
  returnDate?: string;
  createdAt: string;
};

export type ReservationStatusChangedPayload = {
  reservationId: string;
  fromStatus: string;
  toStatus: string;
  updatedAt: string;
};

export type ServiceReservationCreatedPayload = {
  reservationId: string;
  serviceId: string;
  serviceType: string;
  status: string;
  partySize: number;
  quantity: number;
  totalPrice: number;
  currency: string;
  serviceDate?: string;
  createdAt: string;
};
