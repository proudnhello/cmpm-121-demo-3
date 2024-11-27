import { ArrayIndex, type Coin, type GeoLocation } from "./interfaces.ts";

// The state manager class is responsible for saving and loading the game state
export class StateManager {
  private readonly STATE_KEY = "mapState";

  // Save the game state
  public saveState(data: {
    playerLocation: GeoLocation;
    playerCoins: Coin[];
    cacheMomentos: [ArrayIndex, string][];
    linePoints: GeoLocation[][];
  }) {
    localStorage.setItem(this.STATE_KEY, JSON.stringify(data));
  }

  // Load the game state
  public loadState(): {
    playerLocation: GeoLocation;
    playerCoins: Coin[];
    cacheMomentos: [ArrayIndex, string];
    linePoints: GeoLocation[][];
  } | boolean {
    const state = JSON.parse(localStorage.getItem(this.STATE_KEY)!);
    if (!state) {
      console.log("No state found in local storage, using default");
      return false;
    }
    return state;
  }

  // Clear the game state
  public clearState() {
    localStorage.removeItem(this.STATE_KEY);
  }
}
