import Link from "next/link";
import { notFound } from "next/navigation";
import { savePostPurchaseTravellerDataAction } from "@/app/account/traveller-data/actions";
import styles from "@/app/account/account.module.css";
import type { PaymentTargetType } from "@/domain/payment/types";
import type { TravellerPostPurchaseData, TravellerRequirementField } from "@/domain/traveller/types";
import { getLocale } from "@/lib/get-locale";
import { buildTravellerDataCompletion, isTravellerDataEncryptionConfigured, listTravellerDataForCustomer } from "@/lib/traveller-data";
import { requireCustomerIdentity } from "@/lib/require-customer-identity";
import { resolveTravellerReservationContextForCustomer } from "@/lib/traveller-reservation-context";
import { travellerFieldsForReservationTraveller, travellerRequirementsDeadline } from "@/lib/traveller-requirements";

function validTargetType(value: string): PaymentTargetType | null {
  return value === "trip" || value === "service" ? value : null;
}

const labels: Record<TravellerRequirementField, [string, string]> = {
  secondSurname: ["Second surname", "Segundo apellido"],
  sex: ["Sex as shown on identity/travel document", "Sexo según documento de identidad/viaje"],
  documentType: ["Document type", "Tipo de documento"],
  documentNumber: ["Document number", "Número de documento"],
  documentSupportNumber: ["Document support number", "Número de soporte del documento"],
  documentIssuingCountry: ["Issuing country", "País emisor"],
  documentExpiryDate: ["Document expiry date", "Fecha de caducidad"],
  residenceAddress: ["Habitual residence address", "Dirección de residencia habitual"],
  residenceCity: ["Habitual residence city", "Localidad de residencia habitual"],
  residenceCountry: ["Habitual residence country", "País de residencia habitual"],
  phone: ["Phone", "Teléfono"],
  email: ["Email", "Correo electrónico"],
  emergencyContactName: ["Emergency contact", "Contacto de emergencia"],
  emergencyContactPhone: ["Emergency contact phone", "Teléfono del contacto de emergencia"],
  minorTravelAuthorization: ["Minor travel authorisation", "Autorización de viaje del menor"]
};

function safeDomToken(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function Field({
  field,
  value,
  locale,
  disabled,
  id,
  describedBy,
  invalid,
  autoFocus
}: {
  field: TravellerRequirementField;
  value: string;
  locale: "en" | "es";
  disabled: boolean;
  id: string;
  describedBy?: string;
  invalid: boolean;
  autoFocus: boolean;
}) {
  const label = labels[field][locale === "es" ? 1 : 0];
  const common = {
    id,
    name: field,
    defaultValue: value,
    disabled,
    required: true,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    autoFocus
  };
  if (field === "sex") return <label className={styles.field} htmlFor={id}><span>{label}</span><select {...common}><option value="">—</option><option value="female">{locale === "es" ? "Femenino" : "Female"}</option><option value="male">{locale === "es" ? "Masculino" : "Male"}</option><option value="x">X</option><option value="not-stated">{locale === "es" ? "No indicado" : "Not stated"}</option></select></label>;
  if (field === "documentType") return <label className={styles.field} htmlFor={id}><span>{label}</span><select {...common}><option value="">—</option><option value="passport">{locale === "es" ? "Pasaporte" : "Passport"}</option><option value="dni">DNI</option><option value="tie">TIE</option><option value="national-id">{locale === "es" ? "Documento nacional de identidad" : "National identity card"}</option><option value="other">{locale === "es" ? "Otro" : "Other"}</option></select></label>;
  if (field === "minorTravelAuthorization") return <label className={styles.field} htmlFor={id}><span>{label}</span><select {...common}><option value="">—</option><option value="pending">{locale === "es" ? "Pendiente" : "Pending"}</option><option value="confirmed">{locale === "es" ? "Confirmada / disponible" : "Confirmed / available"}</option><option value="not-required">{locale === "es" ? "No requerida" : "Not required"}</option></select></label>;
  if (field === "documentExpiryDate") return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="date" /></label>;
  if (field === "email") return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="email" autoComplete="email" /></label>;
  if (field === "phone") return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="tel" autoComplete="tel" /></label>;
  if (field === "residenceAddress") return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="text" autoComplete="street-address" /></label>;
  if (field === "residenceCity") return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="text" autoComplete="address-level2" /></label>;
  if (field === "residenceCountry") return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="text" autoComplete="country-name" /></label>;
  if (field === "emergencyContactPhone") return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="tel" autoComplete="off" /></label>;
  return <label className={styles.field} htmlFor={id}><span>{label}</span><input {...common} type="text" autoComplete="off" /></label>;
}

export const metadata = {
  title: "Traveller information",
  description: "Complete traveller details required after booking."
};

export default async function TravellerDataPage({ params, searchParams }: {
  params: Promise<{ targetType: string; id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; traveller?: string; field?: string }>;
}) {
  const [{ targetType: rawType, id }, query, locale, identity] = await Promise.all([params, searchParams, getLocale(), requireCustomerIdentity()]);
  const targetType = validTargetType(rawType);
  if (!targetType) notFound();
  const context = await resolveTravellerReservationContextForCustomer(identity.id, targetType, id);
  if (!context) notFound();

  const t = (en: string, es: string) => locale === "es" ? es : en;
  const profile = context.requirements;
  const storageReady = isTravellerDataEncryptionConfigured();
  const stored = storageReady
    ? await listTravellerDataForCustomer({ identityId: identity.id, targetType, reservationId: context.reservationId })
    : new Map<string, TravellerPostPurchaseData>();
  const deadline = travellerRequirementsDeadline(profile, context.startDate);
  const today = new Date().toISOString().slice(0, 10);
  const editingOpen = context.status !== "cancelled" && (!deadline || today <= deadline);
  const errors: Record<string, string> = {
    "invalid-request": t("The request is incomplete.", "La solicitud está incompleta."),
    "invalid-traveller": t("That traveller is not part of this reservation.", "Ese viajero no pertenece a esta reserva."),
    "validation": t("Review the highlighted field. Check date, email and phone formats; a travel document must remain valid for the trip or service date.", "Revisa el campo resaltado. Comprueba los formatos de fecha, correo y teléfono; el documento de viaje debe seguir vigente en la fecha del viaje o servicio."),
    "editing-closed": t("The editing deadline has passed. Contact the travel team if a correction is required.", "Ha finalizado el plazo de edición. Contacta con el equipo de viaje si necesitas corregir un dato."),
    "encryption-unavailable": t("Traveller information is unavailable right now. Return to the reservation and try again later.", "La información de viajeros no está disponible en este momento. Vuelve a la reserva e inténtalo más tarde."),
    "cancelled": t("Traveller information cannot be changed on a cancelled reservation.", "No se puede modificar la información de viajeros de una reserva cancelada."),
    "not-required": t("This reservation does not require additional traveller information.", "Esta reserva no requiere información adicional de viajeros."),
    "save": t("The traveller information could not be saved. Review the traveller and try again.", "No se pudo guardar la información del viajero. Revisa los datos e inténtalo de nuevo.")
  };

  if (!profile || profile.preset === "none" || !context.travellers.length) {
    return <main className="section"><div className={`container ${styles.shell}`}><section className={styles.panel}><div className="eyebrow">{t("Traveller information", "Información de viajeros")}</div><h1>{context.label}</h1><div className={styles.notice}><strong>{t("Nothing else needed", "No necesitas añadir más datos")}</strong><br />{t("This reservation does not require additional traveller information.", "Esta reserva no requiere información adicional de viajeros.")}</div><p><Link className="button button-secondary" href={context.detailUrl}>{t("Back to reservation", "Volver a la reserva")}</Link></p></section></div></main>;
  }

  const completions = context.travellers.map((traveller) => buildTravellerDataCompletion(profile, traveller, stored.get(traveller.id)));
  const completedCount = completions.filter((item) => item.complete).length;
  const allComplete = completedCount === context.travellers.length;
  const targetedError = Boolean(query.error && query.traveller && errors[query.error]);

  return (
    <main className="section">
      <div className={`container ${styles.shell}`}>
        <section className={styles.panel}>
          <div className="eyebrow">{t("Traveller information", "Información de viajeros")}</div>
          <h1>{context.label}</h1>
          <p className={styles.lead}>{t("Complete only the information required for this reservation. You will not be asked to upload a copy or photo of your passport or identity document here.", "Completa únicamente la información necesaria para esta reserva. Aquí no te pediremos subir una copia ni una foto del pasaporte o documento de identidad.")}</p>
          <div className={styles.notice}>
            <strong>{allComplete ? t("✓ Everything is ready", "✓ Todo listo") : t("Action required · complete traveller information", "Acción pendiente · completa los datos de viajeros")}</strong><br />
            {allComplete
              ? t(`${completedCount}/${context.travellers.length} travellers complete. All required information has been provided.`, `${completedCount}/${context.travellers.length} viajeros completos. Ya has proporcionado toda la información requerida.`)
              : t(`${completedCount}/${context.travellers.length} travellers complete. Save each traveller before continuing to the next one.`, `${completedCount}/${context.travellers.length} viajeros completos. Guarda cada viajero antes de continuar con el siguiente.`)}
          </div>
          <dl className={styles.profileList}>
            <div><dt>{t("Progress", "Progreso")}</dt><dd><strong>{completedCount}/{context.travellers.length}</strong></dd></div>
            {deadline ? <div><dt>{t("Editing deadline", "Fecha límite de edición")}</dt><dd>{deadline}</dd></div> : null}
            <div><dt>{t("Data retention period after the trip/service", "Conservación de datos tras el viaje/servicio")}</dt><dd>{profile.retentionDaysAfterEnd} {t("days", "días")}</dd></div>
          </dl>
          {!storageReady ? <div className={styles.notice} role="alert" aria-live="assertive">{errors["encryption-unavailable"]}</div> : null}
          {!editingOpen ? <div className={styles.notice} role="alert" aria-live="assertive">{errors[context.status === "cancelled" ? "cancelled" : "editing-closed"]}</div> : null}
          {query.error && errors[query.error] && !targetedError ? <div className={styles.notice} role="alert" aria-live="assertive">{errors[query.error]}</div> : null}
          <p className={styles.lead}>{t("We protect these details and keep them only for the period needed for the reservation and applicable requirements. Health information is not requested here.", "Protegemos estos datos y los conservamos solo durante el periodo necesario para la reserva y los requisitos aplicables. Aquí no se solicitan datos de salud.")}</p>
          <div className={styles.actions}><Link className="button button-secondary" href={context.detailUrl}>{t("Back to reservation", "Volver a la reserva")}</Link></div>
        </section>

        {context.travellers.map((traveller, index) => {
          const fields = travellerFieldsForReservationTraveller(profile, traveller);
          const current = stored.get(traveller.id) ?? {};
          const completion = completions[index];
          const saved = query.saved === traveller.id;
          const travellerError = query.traveller === traveller.id && query.error && errors[query.error] ? errors[query.error] : "";
          const requestedField = query.field as TravellerRequirementField | undefined;
          const invalidField = travellerError && query.error === "validation" && requestedField && fields.includes(requestedField) ? requestedField : undefined;
          const token = safeDomToken(traveller.id);
          const errorId = `traveller-error-${token}`;
          const statusId = `traveller-status-${token}`;
          return (
            <section className={styles.panel} style={{ marginTop: "1rem" }} key={traveller.id} aria-labelledby={`traveller-heading-${token}`}>
              <div className="eyebrow">{completion.complete ? t("✓ Complete", "✓ Completo") : t("Information needed", "Información pendiente")}</div>
              <h2 id={`traveller-heading-${token}`}>{index + 1}. {traveller.firstName} {traveller.lastName}</h2>
              <p className={styles.lead}>{completion.complete ? t("All required fields are complete. You can review or correct them while editing remains open.", "Todos los campos requeridos están completos. Puedes revisarlos o corregirlos mientras el plazo de edición siga abierto.") : t("Complete the fields below and save this traveller before continuing. All fields shown are required.", "Completa los campos de abajo y guarda este viajero antes de continuar. Todos los campos mostrados son obligatorios.")}</p>
              <p className={styles.lead}>{traveller.ageAtDeparture} {t("years", "años")} · {traveller.nationality}</p>
              {saved ? <div className={styles.notice} id={statusId} role="status" aria-live="polite"><strong>{t("Saved", "Guardado")}</strong><br />{t("Traveller information updated.", "Información del viajero actualizada.")}</div> : null}
              {travellerError ? <div className={styles.notice} id={errorId} role="alert" aria-live="assertive">{travellerError}</div> : null}
              <form action={savePostPurchaseTravellerDataAction} className={styles.form} autoComplete="off" aria-describedby={travellerError && !invalidField ? errorId : undefined}>
                <input type="hidden" name="targetType" value={targetType} />
                <input type="hidden" name="reservationId" value={context.reservationId} />
                <input type="hidden" name="travellerId" value={traveller.id} />
                <div className={styles.formGrid}>{fields.map((field) => {
                  const isInvalid = invalidField === field;
                  return <Field
                    key={field}
                    field={field}
                    value={String(current[field as keyof TravellerPostPurchaseData] ?? "")}
                    locale={locale}
                    disabled={!editingOpen || !storageReady}
                    id={`traveller-${token}-${field}`}
                    describedBy={isInvalid ? errorId : undefined}
                    invalid={isInvalid}
                    autoFocus={isInvalid}
                  />;
                })}</div>
                {editingOpen && storageReady ? <button className="button button-primary" type="submit">{completion.complete ? t("Save changes", "Guardar cambios") : t("Save traveller and continue", "Guardar viajero y continuar")}</button> : null}
              </form>
            </section>
          );
        })}
      </div>
    </main>
  );
}
