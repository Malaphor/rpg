import { buildMenuMap } from "./assets/maps/buildMenu.js";
import { worldMap } from "./assets/maps/map.js";

class Assets {
  constructor() {
    this.toLoad = {
      warriorBlue:
        "assets/Factions/Knights/Troops/Warrior/Blue/Warrior_Blue.png",
      archerBlue: "assets/Factions/Knights/Troops/Archer/Blue/Archer_Blue.png",
      arrow: "assets/Factions/Knights/Troops/Archer/Arrow/Arrow.png",
      brokenHouse:
        "assets/Factions/Knights/Buildings/House/House_Destroyed.png",
      buildingHouse:
        "assets/Factions/Knights/Buildings/House/House_Construction.png",
      brokenTower:
        "assets/Factions/Knights/Buildings/Tower/Tower_Destroyed.png",
      buildingTower:
        "assets/Factions/Knights/Buildings/Tower/Tower_Construction.png",
      brokenCastle:
        "assets/Factions/Knights/Buildings/Castle/Castle_Destroyed.png",
      brokenGoblinHouse:
        "assets/Factions/Goblins/Buildings/Wood_House/Goblin_House_Destroyed.png",
      brokenGoblinTower:
        "assets/Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_Destroyed.png",
      buttonBlue: "assets/UI/Buttons/Button_Blue.png",
      buttonBluePressed: "assets/UI/Buttons/Button_Blue_Pressed.png",
      gold: "assets/Resources/Resources/G_Idle.png",
      wood: "assets/Resources/Resources/W_Idle.png",
      meat: "assets/Resources/Resources/M_Idle.png",
      goldSpawn: "assets/Resources/Resources/G_Spawn.png",
      woodSpawn: "assets/Resources/Resources/W_Spawn.png",
      meatSpawn: "assets/Resources/Resources/M_Spawn.png",
      pawnBlue: "assets/Factions/Knights/Troops/Pawn/Blue/Pawn_Blue.png",
      fire: "assets/Effects/Fire/Fire.png",
      tntRed: "assets/Factions/Goblins/Troops/TNT/Red/TNT_Red.png",
      dynamite: "assets/Factions/Goblins/Troops/TNT/Dynamite/Dynamite.png",
      explosion: "assets/Effects/Explosion/Explosions.png",
      torchRed: "assets/Factions/Goblins/Troops/Torch/Red/Torch_Red.png",
      dead: "assets/Factions/Knights/Troops/Dead/Dead.png",
      barrelRed: "assets/Factions/Goblins/Troops/Barrel/Red/Barrel_Red.png",
    };

    this.images = {};

    worldMap.tilesets.forEach((tileSet) => {
      this.toLoad[tileSet.name] = `assets/${tileSet.image.substring(3)}`;
    });
    buildMenuMap.tilesets.forEach((tileSet) => {
      this.toLoad[tileSet.name] = `assets/${tileSet.image.substring(3)}`;
    });

    Object.keys(this.toLoad).forEach((key) => {
      const img = new Image();
      img.src = this.toLoad[key];
      this.images[key] = {
        image: img,
        isLoaded: false,
      };
      img.onload = () => {
        this.images[key].isLoaded = true;
      };
    });
  }
}

export const assets = new Assets();

export class HealthBar {
  constructor(game, target, offset = 15) {
    this.game = game;
    this.target = target;
    this.width = 100;
    this.height = 5;
    this.yOffset = offset;
    this.x = this.target.x + this.target.width / 2 - this.width / 2;
    this.y = this.target.y + this.yOffset;
  }

  draw(ctx) {
    ctx.fillStyle = "red";
    ctx.fillRect(
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      (this.target.health / this.target.totalHealth) * this.width,
      this.height
    );
    ctx.strokeRect(
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      this.width,
      this.height
    );
  }
}

class Button {
  constructor(game, target, xOffset, yOffset) {
    this.game = game;
    this.target = target;
    this.width = 32;
    this.height = 32;
    this.x = this.target.x + xOffset; // + this.target.width / 2 - this.width / 2;
    this.y = this.target.y + yOffset; // + 80 - this.width / 2;
    this.frameTimer = 0;
    this.frameInterval = 250; //250ms
    this.visible = false;
  }

  update(deltaTime) {
    if (!this.visible) return;
    //animation
    if (this.frameTimer > this.frameInterval) {
      this.imageIndex === 0 ? (this.imageIndex = 1) : (this.imageIndex = 0);
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    ctx.drawImage(
      this.images[this.imageIndex],
      this.x + 10 - this.game.viewportX,
      this.y - 20 - this.game.viewportY,
      this.width,
      this.height
    );
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "black";
    this.imageIndex === 0
      ? ctx.fillText(
          this.text,
          this.x + 21 - this.game.viewportX,
          this.y - 1 - this.game.viewportY
        )
      : ctx.fillText(
          this.text,
          this.x + 21 - this.game.viewportX,
          this.y + 0.5 - this.game.viewportY
        );
  }
}

export class BlueButton extends Button {
  constructor(game, target, text, xOffset = 0, yOffset = 0) {
    super(game, target, xOffset, yOffset);
    this.text = text;
    this.images = [
      assets.images.buttonBlue.image,
      assets.images.buttonBluePressed.image,
    ];
    this.imageIndex = 0;
    this.image = this.images[this.imageIndex];
  }
}
