// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Basically, this file exists because I'm paranoid about the possibility of swapping out the leaflet library for something else in the future.
// The professor seems to be going on about how we should make it easy to swap out libraries, and I *suspect* that's because he's going to make us do it at some point.
// So everything that interacts with leaflet is going to be in this file, to hopefully make it easier to swap out later.
// Will be largely useless and redundant if we never actually swap out leaflet.

// The idea for these interfaces is that they should be able to be used to represent a point on the map in two different ways:
// 1. As a latitude and longitude
// 2. As an array index representing a cell in the grid
// Right now, they're the same, but they might not be in the future. Even if they never change, it makes it clearer which is which
export interface GeoLocation {
  lat: number;
  long: number;
}

export interface ArrayIndex {
  i: number;
  j: number;
}

// The size of a tile in degrees of latitude and longitude
const TILE_DEGREES = 1e-4;

// Wrapper function to create and set up map. Will also add a tile layer to the map.
export function makeMap(element: HTMLElement, mapConfig: {
  center: GeoLocation;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  zoomControl: false;
  scrollWheelZoom: false;
}) {
  const map = leaflet.map(element, {
    center: leaflet.latLng(mapConfig.center.lat, mapConfig.center.long),
    zoom: mapConfig.zoom,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    zoomControl: mapConfig.zoomControl,
    scrollWheelZoom: mapConfig.scrollWheelZoom,
  });

  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    .addTo(map);

  return map;
}

// Wrapper function to place a marker for the player on the map at a given location.
export function placePlayerMarker(map: leaflet.Map, location: GeoLocation) {
  const playerMarker = leaflet.marker(
    leaflet.latLng(location.lat, location.long),
  );
  playerMarker.bindTooltip("You are here!");
  playerMarker.addTo(map);
}

// Wrapper function to create a marker for a cache on the map at a given location.
export function placeCache(
  map: leaflet.Map,
  origin: GeoLocation,
  arrayLoc: ArrayIndex,
) {
  // Convert cell numbers into lat/lng bounds, based on the origin and the size of a tile
  const bounds = leaflet.latLngBounds([
    [
      origin.lat + arrayLoc.i * TILE_DEGREES,
      origin.long + arrayLoc.j * TILE_DEGREES,
    ],
    [
      origin.lat + (arrayLoc.i + 1) * TILE_DEGREES,
      origin.long + (arrayLoc.j + 1) * TILE_DEGREES,
    ],
  ]);

  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);
}
