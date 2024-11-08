import {
  type ArrayIndex,
  Cache,
  createCache,
  GeoLocation,
} from "./interfaces.ts";
import * as leafletFunctions from "./leafletFunctions.ts";
import luck from "./luck.ts";
const CACHE_SPAWN_PROBABILITY = 0.1;
const SEED =
  "In the beginning, the universe was created. This has made a lot of people very angry and been widely regarded as a bad move.";
const GAMEPLAY_ZOOM_LEVEL = 19;
const INITIAL_COINS = 5;

// The board class represents the game board, which is a grid of tiles.
// Uses a flyweight pattern to store known locations, to avoid creating multiple objects for the same location.
export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownLocations: Map<string, ArrayIndex>;

  // Caches for tiles that are currently active, and for tiles that have been visited but are not currently active
  private readonly activeCaches: Map<ArrayIndex, Cache>;
  private readonly cacheMomentos: Map<ArrayIndex, string>;

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
    // Iterate over the square of side length 2 * tileVisibilityRadius + 1 centered at the given location, and add each cell to the list
    for (
      // Why deno. Why must for loops be formatted like this?
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

  clearBoard() {
    // Iterate over the active caches and make them momentos
    this.activeCaches.forEach((cache, index) => {
      const momento = cache.toMomento();
      console.log(momento);
      this.cacheMomentos.set(index, cache.toMomento());
    });
    // Clear the map of all markers
    leafletFunctions.clearMap();
  }

  drawBoard(playerLocation: GeoLocation) {
    this.clearBoard();
    // Place the player marker on the map
    leafletFunctions.placePlayerMarker(playerLocation);

    // Iterate over the visible cells and draw them
    this.getVisibleCells(this.getCellForPoint(playerLocation)).forEach(
      (cell) => {
        // luck is deterministic, so for the same cell, the same value will be returned. As such, the caches will be placed in the same locations
        if (luck([cell.i, cell.j, SEED].toString()) < CACHE_SPAWN_PROBABILITY) {
          let cache;
          // If the cache has been visited before, load it from the momento
          if (this.cacheMomentos.has(cell)) {
            cache = createCache(cell, 0);
            cache.fromMomento(this.cacheMomentos.get(cell)!);
          } else { // Otherwise, create a new cache
            cache = createCache(cell, INITIAL_COINS);
          }
          this.activeCaches.set(cell, cache);
          leafletFunctions.placeCache(this, cache);
        }
      },
    );
  }
}
