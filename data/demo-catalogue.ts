import type { TravelCatalogue } from "@/domain/travel/types";

export const demoCatalogue: TravelCatalogue = {
  destinations: [
    {
      id: "dest-barcelona",
      slug: "barcelona",
      name: "Barcelona",
      country: "Spain",
      region: "Catalonia",
      summary: "Mediterranean energy, modernist architecture, neighbourhood life and a food scene made for slow discovery.",
      featured: true,
      translations: {
        es: {
          name: "Barcelona",
          country: "España",
          region: "Cataluña",
          summary: "Energía mediterránea, arquitectura modernista, vida de barrio y una gastronomía pensada para descubrir sin prisas."
        }
      }
    },
    {
      id: "dest-peru",
      slug: "peru",
      name: "Peru",
      country: "Peru",
      region: "Andes & Pacific",
      summary: "Ancient heritage, dramatic Andean landscapes and living traditions across one of South America's most diverse journeys.",
      featured: true,
      translations: {
        es: {
          name: "Perú",
          country: "Perú",
          region: "Andes y Pacífico",
          summary: "Herencia ancestral, paisajes andinos espectaculares y tradiciones vivas en uno de los destinos más diversos de Sudamérica."
        }
      }
    },
    {
      id: "dest-portugal",
      slug: "portugal",
      name: "Portugal",
      country: "Portugal",
      region: "Atlantic Europe",
      summary: "Atlantic coastlines, historic cities, local gastronomy and relaxed routes through a compact and varied country.",
      featured: true,
      translations: {
        es: {
          name: "Portugal",
          country: "Portugal",
          region: "Europa Atlántica",
          summary: "Costa atlántica, ciudades históricas, gastronomía local y rutas relajadas por un país compacto y lleno de contrastes."
        }
      }
    }
  ],
  trips: [
    {
      id: "trip-barcelona-city",
      slug: "barcelona-city-break",
      destinationId: "dest-barcelona",
      title: "Barcelona City Break",
      summary: "Four flexible days combining Barcelona's architecture, neighbourhood character and Mediterranean flavours.",
      durationDays: 4,
      fromPrice: 540,
      currency: "EUR",
      highlights: ["Modernist architecture", "Local neighbourhoods", "Mediterranean food"],
      itinerary: [
        { day: 1, title: "Arrival and old-city atmosphere", summary: "Settle in and discover the historic centre with time for an easy first evening in the city." },
        { day: 2, title: "Modernist Barcelona", summary: "A day shaped around the city's distinctive architecture, broad avenues and creative urban identity." },
        { day: 3, title: "Neighbourhoods and Mediterranean flavours", summary: "Move beyond the headline sights into local streets, markets and a relaxed food-focused experience." },
        { day: 4, title: "Coastline and departure", summary: "Enjoy a final Mediterranean morning before continuing your journey or heading home." }
      ],
      included: ["3 nights accommodation", "Daily breakfast", "Curated self-guided itinerary", "Digital travel information"],
      notIncluded: ["Flights or long-distance transport", "Local transport unless specified", "Meals not described in the itinerary", "Personal expenses"],
      featured: true,
      translations: {
        es: {
          title: "Escapada a Barcelona",
          summary: "Cuatro días flexibles combinando la arquitectura de Barcelona, el carácter de sus barrios y los sabores mediterráneos.",
          highlights: ["Arquitectura modernista", "Barrios con vida local", "Gastronomía mediterránea"],
          itinerary: [
            { day: 1, title: "Llegada y ambiente del casco histórico", summary: "Instálate y descubre el centro histórico con tiempo para disfrutar de una primera tarde tranquila en la ciudad." },
            { day: 2, title: "Barcelona modernista", summary: "Una jornada dedicada a la arquitectura más característica de la ciudad, sus grandes avenidas y su identidad creativa." },
            { day: 3, title: "Barrios y sabores mediterráneos", summary: "Descubre calles, mercados y rincones locales más allá de los lugares imprescindibles, con una experiencia centrada en la gastronomía." },
            { day: 4, title: "Mediterráneo y regreso", summary: "Disfruta de una última mañana junto al Mediterráneo antes de continuar el viaje o regresar a casa." }
          ],
          included: ["3 noches de alojamiento", "Desayuno diario", "Itinerario autoguiado seleccionado", "Información digital del viaje"],
          notIncluded: ["Vuelos o transporte de larga distancia", "Transporte local salvo indicación", "Comidas no descritas en el itinerario", "Gastos personales"]
        }
      }
    },
    {
      id: "trip-peru-andes",
      slug: "peru-andes-discovery",
      destinationId: "dest-peru",
      title: "Peru Andes Discovery",
      summary: "Ten days through Andean landscapes, cultural heritage and memorable multi-stop experiences across Peru.",
      durationDays: 10,
      fromPrice: 1640,
      currency: "EUR",
      highlights: ["Andean landscapes", "Cultural heritage", "Multi-stop itinerary"],
      itinerary: [
        { day: 1, title: "Arrival in Peru", summary: "Begin with a gentle arrival day and an introduction to the rhythm, flavours and history of the journey ahead." },
        { day: 2, title: "City culture and local context", summary: "Explore urban heritage and local culture before moving deeper into the Andean part of the itinerary." },
        { day: 3, title: "Into the Andes", summary: "Travel towards higher landscapes with carefully paced stops and time to adapt to the altitude." },
        { day: 4, title: "Valleys and communities", summary: "Discover agricultural landscapes, traditional communities and regional markets along the route." },
        { day: 5, title: "Heritage route", summary: "A full day dedicated to archaeological heritage and the stories connecting past and present." },
        { day: 6, title: "Mountain journey", summary: "Continue through dramatic highland scenery with viewpoints and flexible cultural stops." },
        { day: 7, title: "Signature Andean experience", summary: "Experience one of the journey's most memorable heritage and landscape days at a comfortable pace." },
        { day: 8, title: "Free exploration", summary: "A lighter day with space for personal exploration, local food and optional experiences." },
        { day: 9, title: "Return through the Andes", summary: "Begin the return journey while revisiting changing landscapes and regional contrasts." },
        { day: 10, title: "Departure", summary: "Finish the itinerary with an easy transfer window and time to prepare for onward travel." }
      ],
      included: ["9 nights accommodation", "Daily breakfast", "Selected ground transfers", "Curated cultural itinerary", "Digital travel information"],
      notIncluded: ["International flights", "Travel insurance", "Meals not specified", "Optional activities", "Personal expenses"],
      featured: true,
      translations: {
        es: {
          title: "Descubriendo los Andes del Perú",
          summary: "Diez días entre paisajes andinos, patrimonio cultural y experiencias inolvidables recorriendo diferentes lugares del Perú.",
          highlights: ["Paisajes andinos", "Patrimonio cultural", "Ruta con múltiples etapas"],
          itinerary: [
            { day: 1, title: "Llegada al Perú", summary: "Empieza con una jornada tranquila de llegada y una primera introducción al ritmo, los sabores y la historia del viaje." },
            { day: 2, title: "Cultura urbana y contexto local", summary: "Explora el patrimonio de la ciudad y su cultura antes de adentrarte en la parte andina del itinerario." },
            { day: 3, title: "Rumbo a los Andes", summary: "Viaja hacia paisajes de mayor altitud con paradas pausadas y tiempo para adaptarte progresivamente." },
            { day: 4, title: "Valles y comunidades", summary: "Descubre paisajes agrícolas, comunidades tradicionales y mercados regionales durante la ruta." },
            { day: 5, title: "Ruta de patrimonio", summary: "Una jornada dedicada al patrimonio arqueológico y a las historias que conectan pasado y presente." },
            { day: 6, title: "Viaje de montaña", summary: "Continúa entre espectaculares paisajes de altura, miradores y paradas culturales flexibles." },
            { day: 7, title: "Gran experiencia andina", summary: "Vive uno de los días más memorables del viaje, combinando patrimonio y paisaje a un ritmo cómodo." },
            { day: 8, title: "Exploración libre", summary: "Una jornada más relajada para explorar por tu cuenta, disfrutar de la gastronomía local y elegir experiencias opcionales." },
            { day: 9, title: "Regreso entre los Andes", summary: "Inicia el camino de regreso observando cómo cambian los paisajes y contrastes regionales." },
            { day: 10, title: "Salida", summary: "Finaliza el itinerario con una ventana cómoda para el traslado y la preparación del siguiente trayecto." }
          ],
          included: ["9 noches de alojamiento", "Desayuno diario", "Traslados terrestres seleccionados", "Itinerario cultural seleccionado", "Información digital del viaje"],
          notIncluded: ["Vuelos internacionales", "Seguro de viaje", "Comidas no especificadas", "Actividades opcionales", "Gastos personales"]
        }
      }
    },
    {
      id: "trip-portugal-road",
      slug: "portugal-atlantic-route",
      destinationId: "dest-portugal",
      title: "Portugal Atlantic Route",
      summary: "A seven-day journey pairing Atlantic scenery, historic cities and the freedom of a flexible road-trip rhythm.",
      durationDays: 7,
      fromPrice: 890,
      currency: "EUR",
      highlights: ["Atlantic coast", "Historic cities", "Self-guided flexibility"],
      itinerary: [
        { day: 1, title: "Arrival and riverside atmosphere", summary: "Start in a historic city with a relaxed first afternoon and time to settle into the Atlantic rhythm." },
        { day: 2, title: "Historic streets and viewpoints", summary: "Explore neighbourhoods, architecture and viewpoints before the road-trip section begins." },
        { day: 3, title: "Atlantic road", summary: "Follow the coast with flexible stops for beaches, fishing towns and regional food." },
        { day: 4, title: "Coastal landscapes", summary: "A slower day built around ocean scenery, walking routes and local discoveries." },
        { day: 5, title: "Heritage city", summary: "Move inland for historic quarters, traditional food and a different side of Portugal." },
        { day: 6, title: "Return to the coast", summary: "Reconnect with the Atlantic through a final scenic route and an easy evening." },
        { day: 7, title: "Departure", summary: "Enjoy a final breakfast and flexible departure window." }
      ],
      included: ["6 nights accommodation", "Daily breakfast", "Route planning", "Digital travel information"],
      notIncluded: ["Flights", "Vehicle hire and fuel", "Road tolls", "Meals not specified", "Personal expenses"],
      featured: true,
      translations: {
        es: {
          title: "Ruta Atlántica por Portugal",
          summary: "Siete días combinando paisajes atlánticos, ciudades históricas y la libertad de una ruta flexible por carretera.",
          highlights: ["Costa atlántica", "Ciudades históricas", "Flexibilidad autoguiada"],
          itinerary: [
            { day: 1, title: "Llegada y ambiente junto al río", summary: "Empieza en una ciudad histórica con una primera tarde tranquila para entrar en el ritmo atlántico." },
            { day: 2, title: "Calles históricas y miradores", summary: "Explora barrios, arquitectura y miradores antes de comenzar la parte del viaje por carretera." },
            { day: 3, title: "Carretera atlántica", summary: "Recorre la costa con paradas flexibles en playas, pueblos pesqueros y lugares de gastronomía regional." },
            { day: 4, title: "Paisajes de costa", summary: "Una jornada más pausada entre vistas al océano, pequeños recorridos a pie y descubrimientos locales." },
            { day: 5, title: "Ciudad histórica", summary: "Adéntrate hacia el interior para descubrir cascos históricos, gastronomía tradicional y otra cara de Portugal." },
            { day: 6, title: "Regreso al Atlántico", summary: "Vuelve a conectar con la costa a través de una última ruta panorámica y una tarde relajada." },
            { day: 7, title: "Salida", summary: "Disfruta del último desayuno y de una ventana flexible para el regreso." }
          ],
          included: ["6 noches de alojamiento", "Desayuno diario", "Planificación de ruta", "Información digital del viaje"],
          notIncluded: ["Vuelos", "Alquiler de vehículo y combustible", "Peajes", "Comidas no especificadas", "Gastos personales"]
        }
      }
    }
  ]
};
