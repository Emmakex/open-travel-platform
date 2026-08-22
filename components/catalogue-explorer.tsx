"use client";

import { useMemo, useState } from "react";
import type { Destination, TravelLocale, Trip } from "@/domain/travel/types";
import { TripCard } from "@/components/trip-card";
import {
  getDictionary,
  localizeDestination,
  localizeTrip
} from "@/lib/i18n";

type Props = {
  destinations: Destination[];
  trips: Trip[];
  locale?: TravelLocale;
};

export function CatalogueExplorer({ destinations, trips, locale = "en" }: Props) {
  const copy = getDictionary(locale);
  const labels = copy.trips.filters;
  const [query, setQuery] = useState("");
  const [destinationId, setDestinationId] = useState("all");
  const [duration, setDuration] = useState("all");
  const [budget, setBudget] = useState("all");

  const localizedDestinations = useMemo(
    () => destinations.map((destination) => localizeDestination(destination, locale)),
    [destinations, locale]
  );
  const localizedTrips = useMemo(
    () => trips.map((trip) => localizeTrip(trip, locale)),
    [trips, locale]
  );
  const destinationById = useMemo(
    () => new Map(localizedDestinations.map((destination) => [destination.id, destination])),
    [localizedDestinations]
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return localizedTrips.filter((trip) => {
      const destination = destinationById.get(trip.destinationId);
      const searchable = [
        trip.title,
        trip.summary,
        ...trip.highlights,
        destination?.name ?? "",
        destination?.country ?? "",
        destination?.region ?? ""
      ].join(" ").toLowerCase();

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesDestination = destinationId === "all" || trip.destinationId === destinationId;
      const matchesDuration =
        duration === "all" ||
        (duration === "short" && trip.durationDays <= 4) ||
        (duration === "medium" && trip.durationDays >= 5 && trip.durationDays <= 8) ||
        (duration === "long" && trip.durationDays >= 9);
      const matchesBudget =
        budget === "all" ||
        (budget === "under-750" && trip.fromPrice < 750) ||
        (budget === "750-1200" && trip.fromPrice >= 750 && trip.fromPrice <= 1200) ||
        (budget === "over-1200" && trip.fromPrice > 1200);

      return matchesQuery && matchesDestination && matchesDuration && matchesBudget;
    });
  }, [budget, destinationById, destinationId, duration, localizedTrips, query]);

  const resetFilters = () => {
    setQuery("");
    setDestinationId("all");
    setDuration("all");
    setBudget("all");
  };

  return (
    <div>
      <div className="catalogue-toolbar" aria-label={labels.aria}>
        <label className="filter-field filter-search">
          <span>{labels.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
          />
        </label>

        <label className="filter-field">
          <span>{labels.destination}</span>
          <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
            <option value="all">{labels.allDestinations}</option>
            {localizedDestinations.map((destination) => (
              <option value={destination.id} key={destination.id}>{destination.name}</option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>{labels.duration}</span>
          <select value={duration} onChange={(event) => setDuration(event.target.value)}>
            <option value="all">{labels.anyLength}</option>
            <option value="short">{labels.short}</option>
            <option value="medium">{labels.medium}</option>
            <option value="long">{labels.long}</option>
          </select>
        </label>

        <label className="filter-field">
          <span>{labels.price}</span>
          <select value={budget} onChange={(event) => setBudget(event.target.value)}>
            <option value="all">{labels.anyBudget}</option>
            <option value="under-750">{labels.under750}</option>
            <option value="750-1200">{labels.mid}</option>
            <option value="over-1200">{labels.over1200}</option>
          </select>
        </label>
      </div>

      <div className="results-bar">
        <strong>{results.length}</strong> {results.length === 1 ? labels.trip : labels.trips} {labels.found}
        <button type="button" className="filter-reset" onClick={resetFilters}>{labels.reset}</button>
      </div>

      {results.length ? (
        <div className="grid-3">
          {results.map((trip) => <TripCard trip={trip} locale={locale} key={trip.id} />)}
        </div>
      ) : (
        <div className="empty-state">
          <strong>{labels.noResults}</strong>
          <p>{labels.broaden}</p>
          <button type="button" className="button button-secondary" onClick={resetFilters}>{labels.showAll}</button>
        </div>
      )}
    </div>
  );
}
