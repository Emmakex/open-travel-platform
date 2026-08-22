import type { Destination, TravelLocale, Trip } from "@/domain/travel/types";

export const dictionaries = {
  en: {
    nav: {
      destinations: "Destinations",
      trips: "Trips",
      account: "Account",
      operator: "Operator",
      brandTagline: "Travel experiences & operations"
    },
    language: { label: "Language", en: "EN", es: "ES" },
    home: {
      eyebrow: "Kairoseth Travel",
      title: "Discover extraordinary journeys. Book with clarity. Travel with confidence.",
      intro: "Browse curated destinations and itineraries, check availability and manage your journey from one connected experience.",
      exploreTrips: "Explore trips",
      discoverDestinations: "Discover destinations",
      trust: ["Curated journeys", "Clear availability", "Connected booking flow"],
      featuredJourney: "Featured journey",
      cityEscape: "City escape",
      destinations: "Destinations",
      curatedJourneys: "Curated journeys",
      bookingJourney: "Booking journey",
      endToEnd: "End-to-end",
      destinationsEyebrow: "Destinations",
      destinationsTitle: "Where will you go next?",
      destinationsCopy: "Start with places that inspire you, then discover journeys built around culture, landscapes, food and memorable local experiences.",
      tripsEyebrow: "Featured journeys",
      tripsTitle: "Trips designed around the experience.",
      tripsCopy: "Compare duration, starting price and highlights, then continue directly to available departures and reservation.",
      allTrips: "Explore all trips →",
      platformEyebrow: "One connected journey",
      platformTitle: "From inspiration to operations.",
      platformCopy: "Kairoseth Travel brings the customer journey and the operational workflow together while keeping each part ready to evolve as the business grows.",
      platformItems: [
        ["Discover", "Explore destinations and compare curated travel experiences."],
        ["Reserve", "Check departures, availability and pricing before booking."],
        ["Manage", "Keep reservations and journey details together in the customer area."],
        ["Operate", "Give travel teams a clear workflow for reservations and status changes."]
      ]
    },
    destinations: {
      eyebrow: "Destinations",
      title: "Find a place that changes your perspective.",
      copy: "Explore destinations selected for culture, landscapes, gastronomy and journeys that can be shaped around different ways of travelling.",
      discover: "Discover →",
      curated: "Curated destination",
      availableTrips: "Available trips",
      tripsIn: "Trips in",
      itineraries: "Itineraries",
      relatedCopy: "Explore the journeys currently available for this destination and continue to dates, availability and booking.",
      noTrips: "No trips are published for this destination yet.",
      country: "Country",
      region: "Region"
    },
    trips: {
      eyebrow: "Journeys",
      title: "Find the journey that fits you.",
      copy: "Search by destination, duration and budget, then compare the details that matter before choosing a departure.",
      days: "days",
      from: "From",
      explore: "Explore trip →",
      highlights: "Trip highlights",
      highlightsEyebrow: "Experience",
      itineraryEyebrow: "Day by day",
      itineraryTitle: "Your itinerary",
      includedEyebrow: "Trip details",
      includedTitle: "What's included",
      notIncludedTitle: "Not included",
      duration: "Duration",
      startingPrice: "Starting price",
      highlightCount: "Highlights",
      exploreDestination: "Explore",
      reserveEyebrow: "Plan your journey",
      reserveTitle: "Check dates and availability",
      reserveCopy: "Choose an available departure, confirm the number of travellers and continue with your reservation.",
      viewDepartures: "View departures",
      filters: {
        aria: "Trip catalogue filters",
        search: "Search",
        searchPlaceholder: "City, country, highlight…",
        destination: "Destination",
        allDestinations: "All destinations",
        duration: "Duration",
        anyLength: "Any length",
        short: "1–4 days",
        medium: "5–8 days",
        long: "9+ days",
        price: "Starting price",
        anyBudget: "Any budget",
        under750: "Under €750",
        mid: "€750–€1,200",
        over1200: "Over €1,200",
        trip: "trip",
        trips: "trips",
        found: "found",
        reset: "Reset filters",
        noResults: "No trips match these filters.",
        broaden: "Reset the catalogue or broaden your search.",
        showAll: "Show all trips"
      }
    },
    booking: {
      eyebrow: "Book your journey",
      intro: "Choose a departure and the number of travellers. Availability, remaining spaces and price are validated before the reservation is created.",
      customerRequired: "Customer session required.",
      customerRequiredCopy: "Sign in to your customer account before creating a reservation.",
      signIn: "Sign in →",
      staffActive: "A staff session is active. Reservation creation is customer-only.",
      openOperator: "Open operator console →",
      departure: "Departure",
      travellers: "Travellers",
      spaces: "spaces",
      create: "Create reservation",
      availabilityEyebrow: "Availability",
      departuresTitle: "Available departures",
      departuresCopy: "Availability is managed by Kairoseth Travel and validated against the current trip inventory.",
      left: "left",
      back: "← Back to trip",
      noDepartures: "No departures are currently available.",
      writesDisabled: "Reservation creation is disabled in this deployment.",
      errors: {
        bookingDisabled: "Reservation creation is disabled in this deployment.",
        invalidParty: "Choose a party size between 1 and 8 travellers.",
        invalidAvailability: "The selected departure is no longer available.",
        insufficientSpace: "The selected departure does not have enough remaining spaces."
      }
    },
    footer: { product: "A Kairoseth travel technology product · 2026" }
  },
  es: {
    nav: {
      destinations: "Destinos",
      trips: "Viajes",
      account: "Mi cuenta",
      operator: "Operador",
      brandTagline: "Experiencias y operaciones de viaje"
    },
    language: { label: "Idioma", en: "EN", es: "ES" },
    home: {
      eyebrow: "Kairoseth Travel",
      title: "Descubre viajes extraordinarios. Reserva con claridad. Viaja con confianza.",
      intro: "Explora destinos e itinerarios seleccionados, consulta disponibilidad y gestiona tu viaje desde una experiencia conectada.",
      exploreTrips: "Explorar viajes",
      discoverDestinations: "Descubrir destinos",
      trust: ["Viajes seleccionados", "Disponibilidad clara", "Reserva conectada"],
      featuredJourney: "Viaje destacado",
      cityEscape: "Escapada urbana",
      destinations: "Destinos",
      curatedJourneys: "Viajes seleccionados",
      bookingJourney: "Proceso de reserva",
      endToEnd: "Completo",
      destinationsEyebrow: "Destinos",
      destinationsTitle: "¿Dónde será tu próximo viaje?",
      destinationsCopy: "Empieza por lugares que te inspiren y descubre viajes creados alrededor de la cultura, los paisajes, la gastronomía y experiencias locales memorables.",
      tripsEyebrow: "Viajes destacados",
      tripsTitle: "Viajes diseñados alrededor de la experiencia.",
      tripsCopy: "Compara duración, precio inicial y puntos destacados, y continúa directamente a fechas disponibles y reserva.",
      allTrips: "Explorar todos los viajes →",
      platformEyebrow: "Un viaje conectado",
      platformTitle: "De la inspiración a la operación.",
      platformCopy: "Kairoseth Travel conecta la experiencia del viajero con la operativa del equipo, manteniendo cada parte preparada para evolucionar con el negocio.",
      platformItems: [
        ["Descubre", "Explora destinos y compara experiencias de viaje seleccionadas."],
        ["Reserva", "Consulta salidas, disponibilidad y precios antes de reservar."],
        ["Gestiona", "Mantén reservas y detalles del viaje juntos en tu área de cliente."],
        ["Opera", "Ofrece al equipo un flujo claro para gestionar reservas y estados."]
      ]
    },
    destinations: {
      eyebrow: "Destinos",
      title: "Encuentra un lugar que cambie tu perspectiva.",
      copy: "Explora destinos seleccionados por su cultura, paisajes, gastronomía y posibilidades para crear diferentes formas de viajar.",
      discover: "Descubrir →",
      curated: "Destino seleccionado",
      availableTrips: "Viajes disponibles",
      tripsIn: "Viajes en",
      itineraries: "Itinerarios",
      relatedCopy: "Explora los viajes disponibles para este destino y continúa a fechas, disponibilidad y reserva.",
      noTrips: "Todavía no hay viajes publicados para este destino.",
      country: "País",
      region: "Región"
    },
    trips: {
      eyebrow: "Viajes",
      title: "Encuentra el viaje que encaja contigo.",
      copy: "Busca por destino, duración y presupuesto y compara los detalles importantes antes de elegir una salida.",
      days: "días",
      from: "Desde",
      explore: "Ver viaje →",
      highlights: "Lo mejor del viaje",
      highlightsEyebrow: "Experiencia",
      itineraryEyebrow: "Día a día",
      itineraryTitle: "Tu itinerario",
      includedEyebrow: "Detalles del viaje",
      includedTitle: "Qué incluye",
      notIncludedTitle: "No incluido",
      duration: "Duración",
      startingPrice: "Precio desde",
      highlightCount: "Destacados",
      exploreDestination: "Explorar",
      reserveEyebrow: "Planifica tu viaje",
      reserveTitle: "Consulta fechas y disponibilidad",
      reserveCopy: "Elige una salida disponible, confirma el número de viajeros y continúa con tu reserva.",
      viewDepartures: "Ver salidas",
      filters: {
        aria: "Filtros del catálogo de viajes",
        search: "Buscar",
        searchPlaceholder: "Ciudad, país, experiencia…",
        destination: "Destino",
        allDestinations: "Todos los destinos",
        duration: "Duración",
        anyLength: "Cualquier duración",
        short: "1–4 días",
        medium: "5–8 días",
        long: "9+ días",
        price: "Precio desde",
        anyBudget: "Cualquier presupuesto",
        under750: "Menos de 750 €",
        mid: "750–1.200 €",
        over1200: "Más de 1.200 €",
        trip: "viaje",
        trips: "viajes",
        found: "encontrados",
        reset: "Restablecer filtros",
        noResults: "Ningún viaje coincide con estos filtros.",
        broaden: "Restablece el catálogo o amplía tu búsqueda.",
        showAll: "Ver todos los viajes"
      }
    },
    booking: {
      eyebrow: "Reserva tu viaje",
      intro: "Elige una salida y el número de viajeros. La disponibilidad, las plazas restantes y el precio se validan antes de crear la reserva.",
      customerRequired: "Necesitas una sesión de cliente.",
      customerRequiredCopy: "Inicia sesión en tu cuenta de cliente antes de crear una reserva.",
      signIn: "Iniciar sesión →",
      staffActive: "Hay una sesión de personal activa. Las reservas solo pueden crearse como cliente.",
      openOperator: "Abrir consola de operador →",
      departure: "Salida",
      travellers: "Viajeros",
      spaces: "plazas",
      create: "Crear reserva",
      availabilityEyebrow: "Disponibilidad",
      departuresTitle: "Salidas disponibles",
      departuresCopy: "La disponibilidad está gestionada por Kairoseth Travel y se valida con el inventario actual del viaje.",
      left: "disponibles",
      back: "← Volver al viaje",
      noDepartures: "No hay salidas disponibles actualmente.",
      writesDisabled: "La creación de reservas está desactivada en este despliegue.",
      errors: {
        bookingDisabled: "La creación de reservas está desactivada en este despliegue.",
        invalidParty: "Elige entre 1 y 8 viajeros.",
        invalidAvailability: "La salida seleccionada ya no está disponible.",
        insufficientSpace: "La salida seleccionada no tiene suficientes plazas disponibles."
      }
    },
    footer: { product: "Un producto de tecnología turística de Kairoseth · 2026" }
  }
} as const;

export function getDictionary(locale: TravelLocale) {
  return dictionaries[locale] ?? dictionaries.en;
}

export function localizeDestination(destination: Destination, locale: TravelLocale): Destination {
  const translation = destination.translations?.[locale];
  return translation ? { ...destination, ...translation } : destination;
}

export function localizeTrip(trip: Trip, locale: TravelLocale): Trip {
  const translation = trip.translations?.[locale];
  return translation ? { ...trip, ...translation } : trip;
}

export function formatCurrency(value: number, currency: string, locale: TravelLocale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}
