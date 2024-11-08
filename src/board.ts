import {
  type ArrayIndex,
  Cache,
  createCache,
  GeoLocation,
  Player,
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
  readonly tileWidth: number; // The width of each tile in degrees of latitude and longitude
  readonly tileVisibilityRadius: number;

  // A map of known locations to avoid creating multiple objects for the same location
  private readonly knownLocations: Map<string, ArrayIndex>;

  // Caches for caches that are currently active, and for momentos of caches that have been visited but are not currently active
  private activeCaches: Map<ArrayIndex, Cache>;
  private cacheMomentos: Map<ArrayIndex, string>;

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

    // Create the map object
    leafletFunctions.makeMap(document.getElementById("map")!, {
      center: playerLocation,
      zoom: GAMEPLAY_ZOOM_LEVEL,
      minZoom: GAMEPLAY_ZOOM_LEVEL,
      maxZoom: GAMEPLAY_ZOOM_LEVEL,
      zoomControl: false,
      scrollWheelZoom: false,
    });
  }

  // Returns the canonical location object for the given location
  private getCannonicalLocation(index: ArrayIndex): ArrayIndex {
    const { i, j } = index;
    const key = [i, j].toString();
    if (!this.knownLocations.has(key)) {
      this.knownLocations.set(key, { i, j });
    }
    return this.knownLocations.get(key)!;
  }

  // Returns the index of the tile containing the given geo location
  getCellForPoint(location: GeoLocation): ArrayIndex {
    const i = Math.floor(location.lat / this.tileWidth);
    const j = Math.floor(location.long / this.tileWidth);
    return this.getCannonicalLocation({ i, j });
  }

  getPointForCell(location: ArrayIndex): GeoLocation {
    return {
      lat: location.i * this.tileWidth + this.tileWidth / 2,
      long: location.j * this.tileWidth + this.tileWidth / 2,
    };
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

  // Set all the active caches to momentos
  setCacheMomentos() {
    this.activeCaches.forEach((cache, index) => {
      this.cacheMomentos.set(index, cache.toMomento());
    });
  }

  // Clear the board of all markers and caches
  clearBoard() {
    // Iterate over the active caches and make them momentos
    this.setCacheMomentos();
    // Clear the active caches
    this.activeCaches = new Map();
    // Clear the map of all markers
    leafletFunctions.clearMap();
  }

  // Save the current state of the board to local storage
  saveState(player: Player) {
    // Save all the mutible state to local storage
    // That is, player location, caches, the polyline, and the player's coins
    this.setCacheMomentos();
    const playerLocation = player.location;
    const playerCache = player.cache;
    const linePoints = leafletFunctions.getPolyPoints();
    localStorage.setItem(
      "mapState",
      JSON.stringify({
        playerLocation,
        cacheMomentos: Array.from(this.cacheMomentos.entries()),
        playerCoins: playerCache.coins,
        linePoints,
      }),
    );
  }

  // Load the state of the board from local storage
  loadState(player: Player) {
    const state = JSON.parse(localStorage.getItem("mapState")!);
    if (!state) {
      console.log("No state found in local storage, using default");
      return;
    }
    // Load the momentos from the state
    this.cacheMomentos = new Map();
    for (const momento of state.cacheMomentos) {
      const key: { i: number; j: number } = momento[0];
      this.cacheMomentos.set(this.getCannonicalLocation(key), momento[1]);
      this;
    }
    // Draw the polyline on the map
    const linePoints: GeoLocation[][] = state.linePoints;
    leafletFunctions.setPolyPoints(linePoints);

    // From momento requires an unparsed object, so stupidly, we parse state.playerCoins back into json
    player.cache.fromMomento(JSON.stringify(state.playerCoins));
    player.location.lat = state.playerLocation.lat;
    player.location.long = state.playerLocation.long;

    // Draw the board and center on the player
    // We jump the player marker here so that if the player moved while offline, the polyline will be drawn correctly
    leafletFunctions.jumpPlayerMarker(player.location);
    this.drawBoard(player);
    leafletFunctions.centerOnPoint(player.location);
    return;
  }

  // Remove any state saved in local storage, then quickly reload the page before the foolish user can add more
  resetState() {
    localStorage.removeItem("mapState");
  }

  drawBoard(player: Player) {
    const playerLocation = player.location;
    this.saveState(player);
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
          leafletFunctions.placeCache(this, cache, player);
        }
      },
    );
  }
}
