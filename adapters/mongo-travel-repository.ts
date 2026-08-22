import type { WithId } from "mongodb";
import type { Destination, Trip } from "@/domain/travel/types";
import { getMongoDatabase } from "@/lib/mongodb";
import type { TravelRepository } from "@/repositories/travel-repository";

export const travelCollectionNames = {
  destinations: "travel_destinations",
  trips: "travel_trips"
} as const;

type StoredDestination = Destination & {
  createdAt?: Date;
  updatedAt?: Date;
};

type StoredTrip = Trip & {
  createdAt?: Date;
  updatedAt?: Date;
};

function stripMongoMetadata<T extends object>(document: WithId<T>): T {
  const { _id: _ignored, ...rest } = document;
  return rest as T;
}

function toDestination(document: WithId<StoredDestination>): Destination {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...destination } = stripMongoMetadata(document);
  return destination;
}

function toTrip(document: WithId<StoredTrip>): Trip {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...trip } = stripMongoMetadata(document);
  return trip;
}

const publicDocumentFilter = {
  publicationStatus: { $ne: "draft" }
} as const;

export class MongoTravelRepository implements TravelRepository {
  async listDestinations() {
    const database = await getMongoDatabase();
    const documents = await database
      .collection<StoredDestination>(travelCollectionNames.destinations)
      .find(publicDocumentFilter)
      .sort({ featured: -1, name: 1 })
      .toArray();

    return documents.map(toDestination);
  }

  async getDestinationBySlug(slug: string) {
    const database = await getMongoDatabase();
    const document = await database
      .collection<StoredDestination>(travelCollectionNames.destinations)
      .findOne({ slug, ...publicDocumentFilter });

    return document ? toDestination(document) : null;
  }

  async listTrips() {
    const database = await getMongoDatabase();
    const documents = await database
      .collection<StoredTrip>(travelCollectionNames.trips)
      .find(publicDocumentFilter)
      .sort({ featured: -1, title: 1 })
      .toArray();

    return documents.map(toTrip);
  }

  async getTripBySlug(slug: string) {
    const database = await getMongoDatabase();
    const document = await database
      .collection<StoredTrip>(travelCollectionNames.trips)
      .findOne({ slug, ...publicDocumentFilter });

    return document ? toTrip(document) : null;
  }
}
