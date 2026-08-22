import type { TravelLocale } from "@/domain/travel/types";

const accountCopy = {
  en: {
    signIn: {
      eyebrow: "Customer account",
      title: "Access your travel account.",
      lead: "Sign in to review reservations, departures and trip details.",
      start: "Start customer demo",
      disabled: "Customer access is disabled in this deployment.",
      noteTitle: "Secure account area.",
      note: "Customer access is separated from staff operations and checked on the server.",
      operator: "Operator sign in →",
      back: "← Back to catalogue"
    },
    account: {
      eyebrow: "My travel account",
      reservations: "Reservations",
      viewAll: "View all →",
      endSession: "Sign out",
      switchStaff: "Staff sign in",
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
      lead: "Review your current and past travel reservations.",
      traveller: "traveller",
      travellers: "travellers",
      view: "View reservation →",
      empty: "No reservations yet.",
      browse: "Browse trips to create one.",
      backAccount: "← Back to account",
      detailEyebrow: "Reservation",
      demoNote: "This reservation is stored in your Kairoseth Travel account.",
      status: "Status",
      unitPrice: "Unit price",
      total: "Total",
      departure: "Departure",
      return: "Return",
      reference: "Reference",
      cancelled: "Reservation status updated to cancelled.",
      cancel: "Cancel reservation",
      all: "← All reservations",
      unavailable: "Unavailable"
    }
  },
  es: {
    signIn: {
      eyebrow: "Cuenta de cliente",
      title: "Accede a tu cuenta de viaje.",
      lead: "Inicia sesión para consultar reservas, salidas y detalles de tus viajes.",
      start: "Iniciar demo de cliente",
      disabled: "El acceso de clientes está desactivado en este despliegue.",
      noteTitle: "Área de cuenta segura.",
      note: "El acceso del cliente está separado de las operaciones internas y se valida en el servidor.",
      operator: "Acceso de operador →",
      back: "← Volver al catálogo"
    },
    account: {
      eyebrow: "Mi cuenta de viaje",
      reservations: "Reservas",
      viewAll: "Ver todas →",
      endSession: "Cerrar sesión",
      switchStaff: "Acceso de personal",
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
      lead: "Consulta tus reservas de viaje actuales y anteriores.",
      traveller: "viajero",
      travellers: "viajeros",
      view: "Ver reserva →",
      empty: "Todavía no hay reservas.",
      browse: "Explora los viajes para crear una.",
      backAccount: "← Volver a mi cuenta",
      detailEyebrow: "Reserva",
      demoNote: "Esta reserva está guardada en tu cuenta de Kairoseth Travel.",
      status: "Estado",
      unitPrice: "Precio unitario",
      total: "Total",
      departure: "Salida",
      return: "Regreso",
      reference: "Referencia",
      cancelled: "El estado de la reserva se ha actualizado a cancelada.",
      cancel: "Cancelar reserva",
      all: "← Todas las reservas",
      unavailable: "No disponible"
    }
  }
} as const;

export function getAccountCopy(locale: TravelLocale) {
  return accountCopy[locale] ?? accountCopy.en;
}
