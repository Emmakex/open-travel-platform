import { changeReservationPackageAddOnsAction } from "@/app/operator/reservations/actions";
import styles from "@/app/operator/operator.module.css";
import type { Reservation, ReservationTripAddOnBooking } from "@/domain/booking/types";
import type { Trip, TripAddOn, TravelLocale } from "@/domain/travel/types";
import { formatOperatorMoney, tr } from "@/lib/operator-i18n";

function travellerNames(reservation: Reservation, ids: string[] | undefined) {
  if (!ids?.length) return "";
  return ids.map((id) => {
    const traveller = reservation.travellers?.find((item) => item.id === id);
    return traveller ? `${traveller.firstName} ${traveller.lastName}` : id;
  }).join(", ");
}

function bookedById(reservation: Reservation) {
  return new Map((reservation.packageAddOns ?? []).map((booking) => [booking.addOnId, booking]));
}

function editableOptions(trip: Trip | null, reservation: Reservation) {
  const catalogue = trip?.addOns ?? [];
  const catalogueIds = new Set(catalogue.map((item) => item.id));
  const historical: TripAddOn[] = (reservation.packageAddOns ?? [])
    .filter((booking) => !catalogueIds.has(booking.addOnId))
    .map((booking) => ({
      id: booking.addOnId,
      code: booking.code,
      title: booking.title,
      titleEs: booking.titleEs,
      description: booking.description,
      descriptionEs: booking.descriptionEs,
      price: booking.unitPrice,
      pricingMode: booking.pricingMode,
      enabled: false
    }));
  return [...catalogue, ...historical];
}

function contractedPrice(booking: ReservationTripAddOnBooking | undefined, addOn: TripAddOn) {
  return booking?.unitPrice ?? addOn.price;
}

export function ReservationPackageAddOns({
  reservation,
  trip,
  locale,
  writesEnabled,
  modificationAllowed
}: {
  reservation: Reservation;
  trip: Trip | null;
  locale: TravelLocale;
  writesEnabled: boolean;
  modificationAllowed: boolean;
}) {
  const current = reservation.packageAddOns ?? [];
  const total = reservation.packageAddOnTotal ?? current.reduce((sum, item) => sum + item.totalPrice, 0);
  const currentById = bookedById(reservation);
  const options = editableOptions(trip, reservation);
  const canEdit = writesEnabled && modificationAllowed && reservation.status !== "cancelled" && Boolean(options.length);

  return (
    <section className={styles.panel} id="package-addons">
      <div className="eyebrow">{tr(locale, "Package supplements", "Suplementos del paquete")}</div>
      <h2>{tr(locale, "Booked optional extras", "Extras opcionales contratados")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "The reservation keeps the contracted supplement snapshot. Existing extras retain their stored unit price during an amendment; newly added extras use the current catalogue price.",
        "La reserva conserva el snapshot contratado de suplementos. Los extras existentes mantienen su precio unitario guardado durante una modificación; los extras nuevos usan el precio actual de catálogo."
      )}</p>

      {current.length ? (
        <div className={styles.definitionList}>
          {current.map((addOn) => {
            const title = locale === "es" ? addOn.titleEs : addOn.title;
            const description = locale === "es" ? addOn.descriptionEs : addOn.description;
            const names = travellerNames(reservation, addOn.travellerIds);
            return (
              <div key={addOn.addOnId}>
                <dt>{title}</dt>
                <dd>
                  {description ? <>{description}<br /></> : null}
                  {addOn.pricingMode === "per-traveller"
                    ? <>{tr(locale, "Travellers", "Viajeros")}: {names || addOn.quantity}<br /></>
                    : <>{tr(locale, "Once per reservation", "Una vez por reserva")}<br /></>}
                  {tr(locale, "Contracted unit price", "Precio unitario contratado")}: {formatOperatorMoney(addOn.unitPrice, reservation.currency, locale, 2)} · {tr(locale, "Quantity", "Cantidad")}: {addOn.quantity}<br />
                  <strong>{tr(locale, "Total", "Total")}: {formatOperatorMoney(addOn.totalPrice, reservation.currency, locale, 2)}</strong>
                </dd>
              </div>
            );
          })}
          <div>
            <dt>{tr(locale, "Supplements total", "Total suplementos")}</dt>
            <dd><strong>{formatOperatorMoney(total, reservation.currency, locale, 2)}</strong></dd>
          </div>
        </div>
      ) : (
        <div className={styles.notice}>{tr(locale, "No package supplements are currently booked.", "Actualmente no hay suplementos del paquete contratados.")}</div>
      )}

      {canEdit ? (
        <form action={changeReservationPackageAddOnsAction} className={styles.editorForm}>
          <input type="hidden" name="reservationId" value={reservation.id} />
          <div className={styles.editorSection}>
            <div>
              <strong>{tr(locale, "Amend supplements", "Modificar suplementos")}</strong>
              <p className={styles.muted}>{tr(
                locale,
                "Select the supplements that should remain on the reservation. Removing an item reduces the reservation total; adding one increases it. Payment history is never rewritten.",
                "Selecciona los suplementos que deben permanecer en la reserva. Quitar un elemento reduce el total; añadirlo lo aumenta. El historial de pagos nunca se reescribe."
              )}</p>
            </div>

            <div className={styles.repeatList}>
              {options.map((addOn) => {
                const booked = currentById.get(addOn.id);
                const pricingMode = booked?.pricingMode ?? addOn.pricingMode;
                const unavailable = !addOn.enabled;
                const previousTravellerIds = new Set(booked?.travellerIds ?? []);
                const title = locale === "es" ? (booked?.titleEs ?? addOn.titleEs) : (booked?.title ?? addOn.title);
                const description = locale === "es" ? (booked?.descriptionEs ?? addOn.descriptionEs) : (booked?.description ?? addOn.description);
                return (
                  <div className={styles.editorSection} key={addOn.id}>
                    <div>
                      <strong>{title}</strong>
                      {description ? <p className={styles.muted}>{description}</p> : null}
                      <p className={styles.muted}>
                        {booked
                          ? `${tr(locale, "Contracted", "Contratado")}: ${formatOperatorMoney(booked.unitPrice, reservation.currency, locale, 2)}`
                          : `${tr(locale, "Current price", "Precio actual")}: ${formatOperatorMoney(addOn.price, reservation.currency, locale, 2)}`}
                        {unavailable ? ` · ${tr(locale, "No longer offered", "Ya no se ofrece")}` : ""}
                      </p>
                    </div>

                    {pricingMode === "per-booking" ? (
                      <label className={styles.checkboxField}>
                        <input type="checkbox" name="bookingAddOnIds" value={addOn.id} defaultChecked={Boolean(booked)} />
                        <span>{tr(locale, "Keep / add once per reservation", "Mantener / añadir una vez por reserva")}</span>
                      </label>
                    ) : (
                      <div className={styles.formGrid}>
                        {(reservation.travellers ?? []).map((traveller) => {
                          const wasSelected = previousTravellerIds.has(traveller.id);
                          const disabledExpansion = unavailable && !wasSelected;
                          return (
                            <label className={styles.checkboxField} key={`${addOn.id}-${traveller.id}`}>
                              <input
                                type="checkbox"
                                name="travellerAddOnSelection"
                                value={`${encodeURIComponent(addOn.id)}|${encodeURIComponent(traveller.id)}`}
                                defaultChecked={wasSelected}
                                disabled={disabledExpansion}
                              />
                              <span>{traveller.firstName} {traveller.lastName}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {booked && unavailable ? (
                      <p className={styles.muted}>{tr(
                        locale,
                        pricingMode === "per-traveller"
                          ? "This historical supplement can be kept, reduced or removed, but cannot be expanded to additional travellers."
                          : "This historical supplement can be kept or removed, but cannot be newly added after removal.",
                        pricingMode === "per-traveller"
                          ? "Este suplemento histórico puede mantenerse, reducirse o quitarse, pero no ampliarse a viajeros adicionales."
                          : "Este suplemento histórico puede mantenerse o quitarse, pero no volver a añadirse después de eliminarlo."
                      )}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <label className={styles.field}>
              <span>{tr(locale, "Reason for change", "Motivo del cambio")}</span>
              <textarea name="reason" maxLength={500} required placeholder={tr(locale, "Explain why the package supplements are being changed.", "Explica por qué se modifican los suplementos del paquete.")} />
            </label>

            <div className={styles.notice}>{tr(
              locale,
              "After saving, the payment summary will show any additional balance due or amount requiring refund review. No refund or new payment is created automatically.",
              "Después de guardar, el resumen de pagos mostrará cualquier saldo adicional pendiente o importe que requiera revisión de reembolso. No se crea automáticamente ningún reembolso ni nuevo pago."
            )}</div>

            <div className={styles.actionsCompact}>
              <button className="button button-primary" type="submit">{tr(locale, "Save supplement changes", "Guardar cambios de suplementos")}</button>
            </div>
          </div>
        </form>
      ) : !modificationAllowed && reservation.status !== "cancelled" ? (
        <div className={styles.notice}>{tr(locale, "The modification deadline has passed, so package supplements are read-only.", "El plazo de modificación ha finalizado, por lo que los suplementos son de solo lectura.")}</div>
      ) : null}
    </section>
  );
}
