import { Actions, BuildingStates, Directions, PlayerState } from "./enums.js";

export default class InputHandler {
  constructor(game) {
    this.game = game;
    window.addEventListener("keydown", (e) => {
      //console.log(e.key);
      const key = e.key.toLowerCase();
      if (this.game.buildMenu.visible) {
        if (key === Actions.CONFIRM) {
          if (this.game.buildMenu.hasEnoughResources()) {
            this.game.buildMenu.target.setState(BuildingStates.BUILD);
            this.game.buildMenu.removeFromInventory();
          } else {
            this.game.buildMenu.error = true;
          }
        } else if (key === Actions.CANCEL) {
          this.game.buildMenu.visible = false;
          this.game.buildMenu.target = undefined;
        }
      } else {
        if (key === Directions.LEFT) {
          this.game.dirKeys.h.val = -1;
          this.game.dirKeys.h.key = Directions.LEFT;
          this.game.playerChar.lastKey = Directions.LEFT;
        } else if (key === Directions.RIGHT) {
          this.game.dirKeys.h.val = 1;
          this.game.dirKeys.h.key = Directions.RIGHT;
          this.game.playerChar.lastKey = Directions.RIGHT;
        } else if (key === Directions.UP) {
          this.game.dirKeys.v.val = -1;
          this.game.dirKeys.v.key = Directions.UP;
          this.game.playerChar.lastKey = Directions.UP;
        } else if (key === Directions.DOWN) {
          this.game.dirKeys.v.val = 1;
          this.game.dirKeys.v.key = Directions.DOWN;
          this.game.playerChar.lastKey = Directions.DOWN;
        } else if (
          key === Actions.ATTACK &&
          this.game.actionKey === undefined
        ) {
          this.game.actionKey = key;
          this.game.playerChar.setState(PlayerState.ATTACK);
        } else if (key === Actions.ACTION) {
          //check if resource or builable is nearby
          this.game.doAnAction();
        } else if (key === Actions.PLAYPAUSE) {
          this.game.playPause();
        } else if (key === Actions.DEBUG) {
          this.game.debug = !this.game.debug;
        }
      }
    });
    window.addEventListener("keyup", (e) => {
      const key = e.key.toLocaleLowerCase();
      if (
        (key === Directions.LEFT || key === Directions.RIGHT) &&
        key === this.game.dirKeys.h.key
      ) {
        this.game.dirKeys.h.val = 0;
        this.game.dirKeys.h.key = undefined;
      } else if (
        (key === Directions.UP || key === Directions.DOWN) &&
        key === this.game.dirKeys.v.key
      ) {
        this.game.dirKeys.v.val = 0;
        this.game.dirKeys.v.key = undefined;
      }
    });
  }
}
