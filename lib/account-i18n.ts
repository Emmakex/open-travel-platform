import type { TravelLocale } from "@/domain/travel/types";

const accountCopy = {
  en: {
    signIn: {
      eyebrow: "Customer demo",
      title: "Explore the complete customer journey.",
      lead: "Start a fictional customer session to create a reservation, review your trips and experience the customer area. No password or real personal data is required.",
      start: "Start customer demo",
      disabled: "The customer demo is disabled in this deployment.",
      noteTitle: "Demo environment.",
      note: "This session contains fictional data only and is intentionally separated from any real authentication or customer system.",
      operator: "Operator/admin demo →",
      back: "← Back to catalogue"
    },
    account: {
      eyebrow: "My travel account",
      reservations: "Reservations",
      viewAll: "View all →",
      endSession: "End demo session",
      switchStaff: "Switch to staff demo",
      suggested: "Suggested next trip",
      viewItinerary: "View itinerary →",
      noTrips: "No trips are currently available.",
      country: "Country",
      language: "Language",
      role: "Role"
    },
    reservations: {
      eyebrow: "My travel account",
      title: "My reservations",
      lead: "Review the trips created during this demo customer session.",
      traveller: "traveller",
      travellers: "travellers",
      view: "View reservation →",
      empty: "No demo reservations yet.",
      browse: "Browse trips to create one.",
      backAccount: "← Back to account",
      detailEyebrow: "Reservation",
      demoNote: "This is a fictional reservation created for the public product demo.",
      status: "Status",
      unitPrice: "Unit price",
      total: "Total",
      departure: "Departure",
      return: "Return",
      reference: "Reference",
      cancelled: "Reservation status updated to cancelled.",
      cancel: "Cancel demo reservation",
      all: "← All reservations",
      unavailable: "Unavailable"
    }
  },
  es: {
    signIn: {
      eyebrow: "Demo de cliente",
      title: "Explora todo el recorrido del cliente.",
      lead: "Inicia una sesión ficticia de cliente para crear una reserva, revisar tus viajes y probar el área de cliente. No necesitas contraseña ni datos personales reales.",
      start: "Iniciar demo de cliente",
      disabled: "La demo de cliente está desactivada en este despliegue.",
      noteTitle: "Entorno de demostración.",
      note: "Esta sesión contiene únicamente datos ficticios y está separada de cualquier sistema real de autenticación o clientes.",
      operator: "Demo de operador/admin →",
      back: "← Volver al catálogo"
    },
    account: {
      eyebrow: "Mi cuenta de viaje",
      reservations: "Reservas",
      viewAll: "Ver todas →",
      endSession: "Finalizar sesión demo",
      switchStaff: "Cambiar a demo de personal",
      suggested: "Próximo viaje sugerido",
      viewItinerary: "Ver itinerario →",
      noTrips: "No hay viajes disponibles actualmente.",
      country: "País",
      language: "Idioma",
      role: "Rol"
    },
    reservations: {
      eyebrow: "Mi cuenta de viaje",
      title: "Mis reservas",
      lead: "Revisa los viajes creados durante esta sesión demo de cliente.",
      traveller: "viajero",
      travellers: "viajeros",
      view: "Ver reserva →",
      empty: "Todavía no hay reservas demo.",
      browse: "Explora los viajes para crear una.",
      backAccount: "← Volver a mi cuenta",
      detailEyebrow: "Reserva",
      demoNote: "Esta es una reserva ficticia creada para la demostración pública del producto.",
      status: "Estado",
      unitPrice: "Precio unitario",
      total: "Total",
      departure: "Salida",
      return: "Regreso",
      reference: "Referencia",
      cancelled: "El estado de la reserva se ha actualizado a cancelada.",
      cancel: "Cancelar reserva demo",
      all: "← Todas las reservas",
      unavailable: "No disponible"
    }
  }
} as const;

export function getAccountCopy(locale: TravelLocale) {
  return accountCopy[locale] ?? accountCopy.en;
}
