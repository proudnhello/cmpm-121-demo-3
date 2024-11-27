// Interface definitions that are used in multiple files

import luck from "./luck.ts";

import { Board } from "./board.ts";

import * as mapFunctions from "./leafletFunctions.ts";

// The idea for these interfaces is that they should be able to be used to represent a point on the map in two different ways:
// 1. As a latitude and longitude
// 2. As an array index representing a cell in the grid
export interface GeoLocation {
  lat: number;
  long: number;
}

export interface ArrayIndex {
  readonly i: number;
  readonly j: number;
}

// A coin is a unique object that can be deposited in a cache
export interface Coin {
  serial: string;
  originIndex: ArrayIndex;
  toButton(board: Board): HTMLButtonElement;
}

// This function generates a coin at a given index, with a unique serial number
export function generateCoin(
  originIndex: ArrayIndex,
  serialNumber: number,
): Coin {
  return {
    originIndex,
    serial: serialNumber.toString(),
    toButton(board: Board) {
      const text =
        `Coin from (${this.originIndex.i}, ${this.originIndex.j}), serial: ${this.serial}`;
      const button = document.createElement("button");
      button.textContent = text;
      button.onclick = () => {
        mapFunctions.centerOnPoint(board.getPointForCell(this.originIndex));
      };
      return button;
    },
  };
}

// A cache is a location where coins can be deposited and collected
export interface Cache {
  index: ArrayIndex;
  coins: Coin[];

  depositCoin(coin: Coin): void;
  collectCoin(): Coin;
  coinCount(): number;
  coinButtons(board: Board): HTMLButtonElement[];

  toMomento(): string;
  fromMomento(momento: string): void;
}

// This function creates a cache at a given index, and fills it with a random number of coins up to a maximum
export function createCache(
  index: ArrayIndex,
  maxInitialCoins: number,
): Cache {
  const cache: Cache = {
    index,
    coins: [],
    depositCoin(coin: Coin) {
      if (!coin) {
        return;
      }
      this.coins.push(coin);
    },
    collectCoin() {
      return this.coins.pop()!;
    },
    coinCount() {
      return this.coins.length;
    },
    coinButtons(board: Board) {
      const coinButtons = [];
      for (const coin of this.coins) {
        coinButtons.push(coin.toButton(board));
      }
      return coinButtons;
    },
    toMomento() {
      // We don't need to store the index, as we know it from the cache's location
      return JSON.stringify(this.coins);
    },
    fromMomento(momento: string) {
      if (!momento) {
        return;
      }
      let parsed: { serial: string; originIndex: ArrayIndex }[];
      try {
        parsed = JSON.parse(momento);
      } catch {
        console.log("Failed to parse momento");
        return;
      }

      // JSON.parse won't create Coin objects, so we need to do that manually
      for (const sequencedCoin of parsed) {
        const coin = generateCoin(index, 0);
        coin.serial = sequencedCoin.serial;
        coin.originIndex = sequencedCoin.originIndex;

        this.depositCoin(coin);
      }
    },
  };

  const coinNum = luck(
    [index.i, index.j, "https://www.youtube.com/watch?v=Jk5L3DRaqjs"]
      .toString(),
  ) * maxInitialCoins; // This formatting is attrocious, but it's what deno fmt believes is correct

  for (let i = 0; i < coinNum; i++) {
    cache.depositCoin(generateCoin(index, i));
  }

  return cache;
}

export interface Player {
  cache: Cache;
  div: HTMLElement;
  updateEvent: Event;
  location: GeoLocation;
}
