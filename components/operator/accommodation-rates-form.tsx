import { saveAccommodationRoomRatesAction } from "@/app/operator/catalogue/accommodations/rates-actions";
import styles from "@/app/operator/operator.module.css";
import type { Accommodation } from "@/domain/accommodation/types";
import type { TravelLocale } from "@/domain/travel/types";
import { tr } from "@/lib/operator-i18n";

const roomKinds = ["single", "double", "twin", "triple", "family", "suite", "other"] as const;
const mealPlans = ["room-only", "breakfast", "half-board", "full-board", "all-inclusive"] as const;

function roomKindLabel(kind: (typeof roomKinds)[number], locale: TravelLocale) {
  const labels = {
    single: ["Single", "Individual"],
    double: ["Double", "Doble"],
    twin: ["Twin", "Twin"],
    triple: ["Triple", "Triple"],
    family: ["Family", "Familiar"],
    suite: ["Suite", "Suite"],
    other: ["Other", "Otro"]
  } as const;
  return locale === "es" ? labels[kind][1] : labels[kind][0];
}

function mealPlanLabel(plan: (typeof mealPlans)[number], locale: TravelLocale) {
  const labels = {
    "room-only": ["Room only", "Solo alojamiento"],
    breakfast: ["Breakfast", "Desayuno"],
    "half-board": ["Half board", "Media pensión"],
    "full-board": ["Full board", "Pensión completa"],
    "all-inclusive": ["All inclusive", "Todo incluido"]
  } as const;
  return locale === "es" ? labels[plan][1] : labels[plan][0];
}

export function AccommodationRatesForm({ accommodation, locale, updated, error }: {
  accommodation: Accommodation;
  locale: TravelLocale;
  updated?: boolean;
  error?: string;
}) {
  return (
    <section className={styles.panel}>
      <div className="eyebrow">{tr(locale, "Room pricing", "Tarifas de habitaciones")}</div>
      <h2>{tr(locale, "Base room rates", "Tarifas base por habitación")}</h2>
      <p className={styles.lead}>{tr(
        locale,
        "Define the commercial room type, meal plan and reference price per room and night. Seasonal rates and supplements are configured in the next pricing step.",
        "Define el tipo comercial de habitación, el régimen y el precio de referencia por habitación y noche. Las temporadas y suplementos se configurarán en el siguiente bloque de pricing."
      )}</p>
      {updated ? <div className={styles.notice}>{tr(locale, "Room rates saved.", "Tarifas de habitaciones guardadas.")}</div> : null}
      {error ? <div className={styles.notice}>{tr(locale, "Review room type, meal plan and nightly price values.", "Revisa el tipo de habitación, el régimen y los precios por noche.")}</div> : null}

      <form action={saveAccommodationRoomRatesAction} className={styles.editorForm}>
        <input type="hidden" name="accommodationId" value={accommodation.id} />
        <div className={styles.managementList}>
          {accommodation.roomTypes.map((room) => (
            <div className={styles.editorSection} key={room.id}>
              <div className={styles.sectionHeader}>
                <div>
                  <strong>{room.name}</strong>
                  <div className={styles.muted}>{room.code}</div>
                </div>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>{tr(locale, "Room type", "Tipo de habitación")}</span>
                  <select name={`roomKind:${room.id}`} defaultValue={room.kind ?? "double"}>
                    {roomKinds.map((kind) => <option value={kind} key={kind}>{roomKindLabel(kind, locale)}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>{tr(locale, "Meal plan", "Régimen")}</span>
                  <select name={`roomMealPlan:${room.id}`} defaultValue={room.mealPlan ?? "room-only"}>
                    {mealPlans.map((plan) => <option value={plan} key={plan}>{mealPlanLabel(plan, locale)}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>{tr(locale, `Base price / room / night (${accommodation.currency})`, `Precio base / habitación / noche (${accommodation.currency})`)}</span>
                  <input type="number" min="0" step="0.01" name={`roomBaseNightlyRate:${room.id}`} defaultValue={room.baseNightlyRate ?? ""} placeholder="0.00" />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.actionsCompact}>
          <button className="button button-primary" type="submit">{tr(locale, "Save room rates", "Guardar tarifas")}</button>
        </div>
      </form>
    </section>
  );
}
