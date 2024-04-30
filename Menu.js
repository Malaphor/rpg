import { buildMenuMap } from "./assets/maps/buildMenu.js";
import { assets } from "./utils.js";

const defaultCost = [
  { name: "wood", image: assets.images.wood.image, quantity: 10 },
  { name: "gold", image: assets.images.gold.image, quantity: 10 },
];

export class BuildMenu {
  constructor(game) {
    this.game = game;
    this.mapTilesets = buildMenuMap.tilesets;
    this.layerData = [];
    this.cost = defaultCost;
    this.target;
    this.visible = false;
    this.frameTimer = 20;
    this.timer = 0;
    this.error = false;
    this.opacity = 1;
    this.title = "Rebuild this building?";
    this.confirmCancel = "Enter = yes, Backspace = no";
    this.errorMessage = "Not enough resources";
    this.load();
  }

  load() {
    buildMenuMap.layers.forEach((layer) => {
      const data = [];
      for (let i = 0; i < layer.data.length; i += buildMenuMap.width) {
        data.push(layer.data.slice(i, i + buildMenuMap.width));
      }
      this.layerData.push({ data: data });
    });
  }

  show(target) {
    this.target = target;
    if (this.target.cost) this.cost = this.target.cost;
    this.visible = true;
  }

  hasEnoughResources() {
    for (const cost of this.cost) {
      const inventoryItem = this.game.inventory.find(
        (item) => item.name === cost.name
      );
      if (inventoryItem.quantity < cost.quantity) return false;
    }
    return true;
  }

  removeFromInventory() {
    this.cost.forEach((cost) => {
      const resourceIndex = this.game.inventory.findIndex(
        (item) => item.name === cost.name
      );
      this.game.inventory[resourceIndex].quantity -= cost.quantity;

      const saveData = JSON.parse(localStorage.getItem("tinySwordsSaveData"));
      localStorage.setItem(
        "tinySwordsSaveData",
        JSON.stringify({
          ...saveData,
          [cost.name]: this.game.inventory[resourceIndex].quantity,
        })
      );
    });
    this.visible = false;
    this.target = undefined;
  }

  update(deltaTime) {
    if (!this.visible || !this.error) return;

    if (this.opacity > 0) {
      if (this.timer > this.frameTimer) {
        this.opacity -= 0.05;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }
    } else {
      this.timer = 0;
      this.opacity = 1;
      this.visible = false;
      this.target = undefined;
      this.error = false;
    }
  }

  draw(ctx) {
    if (!this.visible) return;

    if (this.error) {
      //error
      ctx.fillStyle = `rgb(255 0 0 / ${this.opacity})`;
      ctx.font = "20px sans-serif";
      const textWidth = ctx.measureText(this.errorMessage).width;
      ctx.fillText(this.errorMessage, this.game.width / 2 - textWidth / 2, 230);
    } else {
      for (let l = 0; l < this.layerData.length; l++) {
        for (let y = 0; y < buildMenuMap.height; y++) {
          for (let x = 0; x < buildMenuMap.width; x++) {
            let value = this.layerData[l].data[y][x];
            if (value === 0) continue;
            let tile_x = x * buildMenuMap.tilewidth;
            let tile_y = y * buildMenuMap.tileheight;
            let tileSet;

            for (let i = 0; i < this.mapTilesets.length; i++) {
              if (this.mapTilesets[i].firstgid === value) {
                tileSet = this.mapTilesets[i];
                break;
              } else if (this.mapTilesets[i].firstgid > value) {
                tileSet = this.mapTilesets[i - 1];
                break;
              } else {
                tileSet = this.mapTilesets[i];
              }
            }

            //banner
            ctx.drawImage(
              assets.images[tileSet.name].image,
              ((value - tileSet.firstgid) * tileSet.tilewidth) %
                tileSet.imagewidth,
              Math.floor(
                ((value - tileSet.firstgid) * tileSet.tilewidth) /
                  (tileSet.columns * tileSet.tilewidth)
              ) * tileSet.tilewidth,
              64, //map tilewidth
              64,
              tile_x,
              tile_y,
              64,
              64
            );
          }
        }
      }

      //title
      ctx.font = "20px serif";
      const textWidth = ctx.measureText(this.title).width;
      ctx.fillText(this.title, this.game.width / 2 - textWidth / 2, 230);
      //cost
      this.cost.forEach((item, index) => {
        //images
        ctx.drawImage(item.image, 4.5 * 62 + 96 * index, 4 * 64, 70, 70);
        //quantity
        ctx.font = "16px serif";
        ctx.fillText("x" + item.quantity, 4.5 * 64 + 96 * index + 55, 305);
      });
      //confirmation
      ctx.fillText(
        this.confirmCancel,
        this.game.width / 2 - textWidth / 2,
        360,
        textWidth
      );
    }
  }
}
