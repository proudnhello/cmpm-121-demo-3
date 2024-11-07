// Interface definitions that are used in multiple files

import luck from "./luck.ts";

// The idea for these interfaces is that they should be able to be used to represent a point on the map in two different ways:
// 1. As a latitude and longitude
// 2. As an array index representing a cell in the grid
export interface GeoLocation {
  lat: number;
  long: number;
}

export interface ArrayIndex {
  i: number;
  j: number;
}

// A coin is a unique object that can be deposited in a cache
export interface Coin {
  serial: string;
  originIndex: ArrayIndex;
  owner: Cache;
  toString(): string;
}

// A cache is a location where coins can be deposited and collected
export interface Cache {
  index: ArrayIndex;
  coins: Coin[];

  depositCoin(coin: Coin): void;
  collectCoin(): Coin;
  coinCount(): number;
  coinString(): string;
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
      coin.owner = this;
      this.coins.push(coin);
    },
    collectCoin() {
      return this.coins.pop()!;
    },
    coinCount() {
      return this.coins.length;
    },
    coinString() {
      return this.coins.map((coin) => coin.toString()).join("<br>");
    },
  };

  const coinNum = luck(
    [index.i, index.j, "https://www.youtube.com/watch?v=Jk5L3DRaqjs"]
      .toString(),
  ) * maxInitialCoins; // This formatting is attrocious, but it's what deno fmt believes is correct

  for (let i = 0; i < coinNum; i++) {
    cache.depositCoin(generateCoin(index, cache, i));
  }

  return cache;
}

// This function generates a coin at a given index, with a unique serial number based on the index
export function generateCoin(
  originIndex: ArrayIndex,
  cache: Cache,
  serialNumber: number,
): Coin {
  return {
    originIndex,
    owner: cache,
    serial: serialNumber.toString(),
    toString() {
      return `Coin from (${originIndex.i}, ${originIndex.j}), serial: ${this.serial}`;
    },
  };
}

// This cache is the player's inventory
export const player = createCache({ i: 0, j: 0 }, 0);

export const playerDiv = document.getElementById("player")!;
playerDiv.innerHTML = "You have " + player.coinCount().toString() +
  " coins.<br>They are:<br> " + player.coinString();
playerDiv.addEventListener("player-update", () => {
  playerDiv.innerHTML = "You have " + player.coinCount().toString() +
    " coins<br>They are:<br> " + player.coinString();
});

// This event is used to update the player's inventory display
export const playerUpdateEvent = new Event("player-update");
