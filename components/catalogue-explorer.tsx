"use client";

import { useMemo, useState } from "react";
import type { Destination, Trip } from "@/domain/travel/types";
import { TripCard } from "@/components/trip-card";

type Props = {
  destinations: Destination[];
  trips: Trip[];
};

export function CatalogueExplorer({ destinations, trips }: Props) {
  const [query, setQuery] = useState("");
  const [destinationId, setDestinationId] = useState("all");
  const [duration, setDuration] = useState("all");
  const [budget, setBudget] = useState("all");

  const destinationById = useMemo(
    () => new Map(destinations.map((destination) => [destination.id, destination])),
    [destinations]
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return trips.filter((trip) => {
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
  }, [budget, destinationById, destinationId, duration, query, trips]);

  const resetFilters = () => {
    setQuery("");
    setDestinationId("all");
    setDuration("all");
    setBudget("all");
  };

  return (
    <div>
      <div className="catalogue-toolbar" aria-label="Trip catalogue filters">
        <label className="filter-field filter-search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="City, country, highlight…"
          />
        </label>

        <label className="filter-field">
          <span>Destination</span>
          <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>
            <option value="all">All destinations</option>
            {destinations.map((destination) => (
              <option value={destination.id} key={destination.id}>{destination.name}</option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Duration</span>
          <select value={duration} onChange={(event) => setDuration(event.target.value)}>
            <option value="all">Any length</option>
            <option value="short">1–4 days</option>
            <option value="medium">5–8 days</option>
            <option value="long">9+ days</option>
          </select>
        </label>

        <label className="filter-field">
          <span>Starting price</span>
          <select value={budget} onChange={(event) => setBudget(event.target.value)}>
            <option value="all">Any budget</option>
            <option value="under-750">Under €750</option>
            <option value="750-1200">€750–€1,200</option>
            <option value="over-1200">Over €1,200</option>
          </select>
        </label>
      </div>

      <div className="results-bar">
        <strong>{results.length}</strong> {results.length === 1 ? "trip" : "trips"} found
        <button type="button" className="filter-reset" onClick={resetFilters}>Reset filters</button>
      </div>

      {results.length ? (
        <div className="grid-3">
          {results.map((trip) => <TripCard trip={trip} key={trip.id} />)}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No trips match these filters.</strong>
          <p>Reset the catalogue or broaden your search.</p>
          <button type="button" className="button button-secondary" onClick={resetFilters}>Show all trips</button>
        </div>
      )}
    </div>
  );
}
