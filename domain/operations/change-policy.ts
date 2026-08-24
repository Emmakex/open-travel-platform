export type ReservationChangePolicy = {
  /** Customer self-service cancellation can be disabled per product. Undefined preserves legacy behaviour (allowed). */
  customerCancellationAllowed?: boolean;
  /** Minimum whole hours before service/trip start required for customer self-service cancellation. */
  customerCancellationCutoffHours?: number;
  /** Minimum whole hours before service/trip start required for staff modifications. */
  staffModificationCutoffHours?: number;
  /** Minimum whole hours before service/trip start required for staff cancellation. */
  staffCancellationCutoffHours?: number;
  /** Send customer email after staff-driven amendments/status changes. Undefined defaults to enabled. */
  notifyCustomerOnStaffChange?: boolean;
};
