import { type ArrayIndex, Cache, GeoLocation } from "./interfaces.ts";
import * as leafletFunctions from "./leafletFunctions.ts";
import luck from "./luck.ts";
const CACHE_SPAWN_PROBABILITY = 0.1;
const SEED =
  "In the beginning, the universe was created. This has made a lot of people very angry and been widely regarded as a bad move.";
const GAMEPLAY_ZOOM_LEVEL = 19;

// The board class represents the game board, which is a grid of tiles.
// Uses a flyweight pattern to store known locations, to avoid creating multiple objects for the same location.
export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownLocations: Map<string, ArrayIndex>;

  // Caches for tiles that are currently active, and for tiles that have been visited but are not currently active
  private readonly activeCaches: Map<ArrayIndex, Cache>;
  private readonly cacheMomentos: Map<ArrayIndex, Cache>;

  constructor(
    tileWidth: number,
    tileVisibilityRadius: number,
    playerLocation: GeoLocation,
  ) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;

    this.activeCaches = new Map();
    this.cacheMomentos = new Map();
    this.knownLocations = new Map();

    leafletFunctions.makeMap(document.getElementById("map")!, {
      center: playerLocation,
      zoom: GAMEPLAY_ZOOM_LEVEL,
      minZoom: GAMEPLAY_ZOOM_LEVEL,
      maxZoom: GAMEPLAY_ZOOM_LEVEL,
      zoomControl: false,
      scrollWheelZoom: false,
    });
  }

  // Returns the location of the tile at the given array index
  private getCannonicalLocation(index: ArrayIndex): ArrayIndex {
    const { i, j } = index;
    const key = [i, j].toString();
    if (!this.knownLocations.has(key)) {
      this.knownLocations.set(key, { i, j });
    }
    return this.knownLocations.get(key)!;
  }

  // Returns the array index of the tile containing the given location
  getCellForPoint(location: GeoLocation): ArrayIndex {
    const i = Math.floor(location.lat / this.tileWidth);
    const j = Math.floor(location.long / this.tileWidth);
    return this.getCannonicalLocation({ i, j });
  }

  // Returns the bounds of the tile at the given array index
  // The bounds are represented as an array of two GeoLocations, in the order top left, bottom right
  // (same as the leaflet latLngBounds constructor)
  getCellBounds(location: ArrayIndex): GeoLocation[] {
    const { i, j } = location;
    const topLeft = { lat: i * this.tileWidth, long: j * this.tileWidth };
    const bottomRight = {
      lat: (i + 1) * this.tileWidth,
      long: (j + 1) * this.tileWidth,
    };
    return [topLeft, bottomRight];
  }

  // Returns an array of array indices representing the tiles within the visibility radius of the given tile
  getVisibleCells(location: ArrayIndex): ArrayIndex[] {
    const { i, j } = location;
    const visibleCells: ArrayIndex[] = [];
    for (
      let di = -this.tileVisibilityRadius;
      di <= this.tileVisibilityRadius;
      di++
    ) {
      for (
        let dj = -this.tileVisibilityRadius;
        dj <= this.tileVisibilityRadius;
        dj++
      ) {
        visibleCells.push(this.getCannonicalLocation({ i: i + di, j: j + dj }));
      }
    }
    return visibleCells;
  }

  drawBoard(playerLocation: GeoLocation) {
    leafletFunctions.placePlayerMarker(playerLocation);

    // Add caches to the map by cell numbers, using the luck function to determine if a cache should be placed
    this.getVisibleCells(this.getCellForPoint(playerLocation)).forEach(
      (cell) => {
        if (luck([cell.i, cell.j, SEED].toString()) < CACHE_SPAWN_PROBABILITY) {
          leafletFunctions.placeCache(this, cell);
        }
      },
    );
  }
}
