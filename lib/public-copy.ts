import type { TravelLocale } from "@/domain/travel/types";

const publicCopy = {
  en: {
    brandTagline: "Journeys, experiences and travel services",
    footer: "Plan, book and manage your journey with Kairoseth Travel.",
    home: {
      eyebrow: "Your journey, in one place",
      title: "Plan with less friction. Travel with more confidence.",
      intro: "Explore where to go, choose the right trip or service, and keep the important details together before and after booking.",
      items: [
        ["Explore", "Discover destinations, trips and experiences that match the way you want to travel."],
        ["Choose", "Compare dates, availability and prices before you commit."],
        ["Book", "Reserve trips and travel services through a clear, guided flow."],
        ["Manage", "Review reservations, payments and required traveller information from your account."]
      ]
    },
    services: {
      eyebrow: "Travel services",
      title: "Add what your journey needs.",
      intro: "Book activities, transfers and other travel services on their own or alongside an existing trip.",
      activityTitle: "Activities",
      activityCopy: "Guided visits, excursions and local experiences for the days you want to make count.",
      transportTitle: "Transport",
      transportCopy: "Transfers and local transport options with route, capacity, availability and price shown clearly.",
      insuranceTitle: "Travel protection",
      insuranceCopy: "Travel-protection products with provider details and booking conditions shown before purchase.",
      available: "available",
      explore: "Explore →"
    },
    activityCatalogue: {
      title: "Experiences worth adding to the journey",
      intro: "Choose guided visits, excursions and local activities for a Kairoseth trip or for travel booked elsewhere."
    },
    transportCatalogue: {
      title: "Get from arrival to destination with clarity",
      intro: "Choose transfers and transport services by route, capacity, availability and price."
    },
    insuranceCatalogue: {
      title: "Travel protection with the important details upfront",
      intro: "Compare products whose provider, conditions and booking requirements are clearly defined."
    },
    emptyServices: {
      title: "No bookable options are available in this category right now.",
      body: "Explore the rest of the travel catalogue or choose another service category.",
      trips: "Explore trips"
    }
  },
  es: {
    brandTagline: "Viajes, experiencias y servicios",
    footer: "Planifica, reserva y gestiona tu viaje con Kairoseth Travel.",
    home: {
      eyebrow: "Tu viaje, en un solo lugar",
      title: "Menos complicaciones al planificar. Más confianza al viajar.",
      intro: "Descubre destinos, elige el viaje o servicio adecuado y mantén juntos los detalles importantes antes y después de reservar.",
      items: [
        ["Descubre", "Explora destinos, viajes y experiencias que encajen con tu forma de viajar."],
        ["Elige", "Compara fechas, disponibilidad y precios antes de decidir."],
        ["Reserva", "Contrata viajes y servicios mediante un proceso claro y guiado."],
        ["Gestiona", "Consulta reservas, pagos y datos necesarios de los viajeros desde tu cuenta."]
      ]
    },
    services: {
      eyebrow: "Servicios de viaje",
      title: "Añade a tu viaje justo lo que necesitas.",
      intro: "Reserva actividades, traslados y otros servicios de forma independiente o junto a un viaje que ya tengas.",
      activityTitle: "Actividades",
      activityCopy: "Visitas guiadas, excursiones y experiencias locales para aprovechar mejor cada día del viaje.",
      transportTitle: "Transporte",
      transportCopy: "Traslados y opciones de movilidad con ruta, capacidad, disponibilidad y precio claros.",
      insuranceTitle: "Protección de viaje",
      insuranceCopy: "Productos de protección de viaje con proveedor y condiciones visibles antes de contratar.",
      available: "disponibles",
      explore: "Explorar →"
    },
    activityCatalogue: {
      title: "Experiencias que merece la pena añadir al viaje",
      intro: "Elige visitas guiadas, excursiones y actividades locales para un viaje Kairoseth o para un viaje reservado por tu cuenta."
    },
    transportCatalogue: {
      title: "Llega a tu destino con todo más claro",
      intro: "Elige traslados y servicios de transporte por ruta, capacidad, disponibilidad y precio."
    },
    insuranceCatalogue: {
      title: "Protección de viaje con la información importante por delante",
      intro: "Compara productos cuyo proveedor, condiciones y requisitos de contratación estén claramente definidos."
    },
    emptyServices: {
      title: "Ahora mismo no hay opciones disponibles para reservar en esta categoría.",
      body: "Puedes explorar el resto del catálogo de viajes o elegir otra categoría de servicios.",
      trips: "Explorar viajes"
    }
  }
} as const;

export function getPublicCopy(locale: TravelLocale) {
  return publicCopy[locale] ?? publicCopy.en;
}
