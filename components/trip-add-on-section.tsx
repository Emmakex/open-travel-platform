import type { TravelLocale, Trip } from "@/domain/travel/types";

function money(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    style: "currency",
    currency
  }).format(value);
}

export function TripAddOnSection({ trip, locale }: { trip: Trip; locale: TravelLocale }) {
  const addOns = (trip.addOns ?? []).filter((item) => item.enabled);
  if (!addOns.length) return null;
  const t = (en: string, es: string) => locale === "es" ? es : en;

  return (
    <section className="trip-section">
      <div className="eyebrow">{t("Make it yours", "Personaliza tu viaje")}</div>
      <h2>{t("Optional extras", "Extras opcionales")}</h2>
      <p>{t(
        "You can choose these extras while booking and see the updated total before confirming.",
        "Podrás elegir estos extras durante la reserva y ver el total actualizado antes de confirmar."
      )}</p>
      <div className="inclusions-grid">
        {addOns.map((addOn) => (
          <div className="inclusion-panel" key={addOn.id}>
            <h3>{locale === "es" ? addOn.titleEs : addOn.title}</h3>
            {(locale === "es" ? addOn.descriptionEs : addOn.description) ? (
              <p>{locale === "es" ? addOn.descriptionEs : addOn.description}</p>
            ) : null}
            <strong>
              {money(addOn.price, trip.currency, locale)} · {addOn.pricingMode === "per-traveller"
                ? t("per selected traveller", "por viajero seleccionado")
                : t("per booking", "por reserva")}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
