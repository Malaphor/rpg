import { assets } from "./utils.js";
import { worldMap } from "./assets/maps/map.js";
import { Polygon } from "./assets/js/collisions/Collisions.mjs";

export default class Map {
  constructor(game) {
    this.game = game;
    this.viewportWidth = game.width;
    this.viewportHeight = game.height;
    this.mapTilesets = worldMap.tilesets;
    this.spriteFrames = 7;
    this.frameX = 0;
    this.layerData = [];
    this.collisionOriginsData = [[], []];
    this.levelIncreaseLines = [];
    this.levelDecreaseLines = [];
    this.frameInterval = 100; //100ms
    this.frameTimer = 0;
    this.loadCollisionLayers();
    this.loadMapLayers();
    //console.log(this.mapTilesets);
  }

  loadMapLayers() {
    worldMap.layers.forEach((layer) => {
      //console.log(this.mapTilesets);
      if (
        layer.name !== "foreground" &&
        layer.name !== "foreground2" &&
        layer.name !== "buildings" &&
        layer.name !== "resources" &&
        layer.name !== "collision1" &&
        layer.name !== "collision2"
      ) {
        const data = [];
        for (let i = 0; i < layer.data.length; i += 60) {
          data.push(layer.data.slice(i, i + 60));
        }
        this.layerData.push({ data: data });

        //find stairs
        if (layer.name === "ground") {
          let startX, startY, endX;
          for (let y = 0; y < worldMap.height; y++) {
            for (let x = 0; x < worldMap.width; x++) {
              let value = data[y][x];
              if (value === 0) continue;

              if (value === 29) {
                //left side stair
                startX = x * worldMap.tilewidth;
                startY = y * worldMap.tileheight;
              } else if (value === 31) {
                //right side stair
                endX = x * worldMap.tilewidth + worldMap.tilewidth;
                //line at top of stairs
                this.levelIncreaseLines.push(
                  new Polygon(startX, startY, [
                    [0, 0],
                    [endX - startX, 0],
                  ])
                );
                this.collisionOriginsData[0].push([startX, startY]);
                //line at bottom of stairs
                this.levelDecreaseLines.push(
                  new Polygon(startX, startY + worldMap.tileheight, [
                    [0, 0],
                    [endX - startX, 0],
                  ])
                );
                this.collisionOriginsData[1].push([
                  startX,
                  startY + worldMap.tileheight,
                ]);
              } else if (value === 32) {
                //single tile width stair
                startX = x * worldMap.tilewidth;
                startY = y * worldMap.tileheight;
                endX = x * worldMap.tilewidth + worldMap.tilewidth;
                //line at top of stairs
                this.levelIncreaseLines.push(
                  new Polygon(startX, startY, [
                    [0, 0],
                    [endX - startX, 0],
                  ])
                );
                this.collisionOriginsData[0].push([startX, startY]);
                //line at bottom of stairs
                this.levelDecreaseLines.push(
                  new Polygon(startX, startY + worldMap.tileheight, [
                    [0, 0],
                    [endX - startX, 0],
                  ])
                );
                this.collisionOriginsData[1].push([
                  startX,
                  startY + worldMap.tileheight,
                ]);
              }
            }
          }
        }
      }
    });
    //console.log(this.levelIncreaseLines);
    //console.log(this.levelDecreaseLines);
    this.levelDecreaseLines.forEach((line) =>
      this.game.collisionSystem[1].insert(line)
    );
    this.levelIncreaseLines.forEach((line) =>
      this.game.collisionSystem[0].insert(line)
    );
  }

  loadCollisionLayers() {
    let index = 0;
    worldMap.layers.forEach((layer) => {
      if (layer.name === "collision1" || layer.name === "collision2") {
        const data = [];
        for (let i = 0; i < layer.data.length; i += 60) {
          data.push(layer.data.slice(i, i + 60));
        }

        for (let y = 0; y < worldMap.height; y++) {
          for (let x = 0; x < worldMap.width; x++) {
            let value = data[y][x];
            //console.log(y, x, value);
            if (value === 0) continue;
            let tile_x = x * worldMap.tilewidth;
            let tile_y = y * worldMap.tileheight;
            this.game.collisionSystem[index].createPolygon(tile_x, tile_y, [
              [0, 0],
              [worldMap.tilewidth, 0],
              [worldMap.tilewidth, worldMap.tileheight],
              [0, worldMap.tileheight],
            ]);
            this.collisionOriginsData[index].push([tile_x, tile_y]);
          }
        }
        index++;
      }
    });
  }

  update(deltaTime) {
    let centerX = this.game.playerChar.x + this.game.playerChar.width / 2;
    let centerY = this.game.playerChar.y + this.game.playerChar.width / 2;
    //if char close to min horizontal edge, stop moving map
    if (centerX - this.viewportWidth / 2 < 0) {
      this.game.viewportX = 0;
      this.game.nearXedge = true;
    } //if char close to max horizontal edge, stop moving map
    else if (centerX + this.viewportWidth / 2 > this.game.worldWidth) {
      this.game.viewportX = this.game.worldWidth - this.viewportWidth;
      this.game.nearXedge = true;
    } else {
      this.game.viewportX = centerX - this.viewportWidth / 2;
      this.game.nearXedge = false;
    }
    //if char close to min vertical edge, stop moving map
    if (centerY - this.viewportHeight / 2 < 0) {
      this.game.viewportY = 0;
      this.game.nearYedge = true;
    } //if char close to max vertical edge, stop moving map
    else if (centerY + this.viewportHeight / 2 > this.game.worldHeight) {
      this.game.viewportY = this.game.worldHeight - this.viewportHeight;
      this.game.nearYedge = true;
    } else {
      this.game.viewportY = centerY - this.viewportHeight / 2;
      this.game.nearYedge = false;
    }
    //console.log(this.game.viewportX, this.game.viewportY);
    //sprite animation
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.spriteFrames) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
  }

  draw(ctx) {
    let minX = Math.floor(this.game.viewportX / worldMap.tilewidth);
    let minY = Math.floor(this.game.viewportY / worldMap.tileheight);
    let maxX = Math.ceil(
      (this.game.viewportX + this.viewportWidth) / worldMap.tilewidth
    );
    let maxY = Math.ceil(
      (this.game.viewportY + this.viewportHeight) / worldMap.tileheight
    );
    //console.log("before: ", minX, minY, maxX, maxY);

    if (minX < 0) {
      minX = 0;
    }
    if (minY < 0) {
      minY = 0;
    }
    if (maxX > worldMap.width) {
      maxX = worldMap.width;
    }
    if (maxY > worldMap.height) {
      maxY = worldMap.height;
    }
    //console.log("after: ", minX, minY, maxX, maxY);
    //console.log(this.layerData[0]);
    for (let l = 0; l < this.layerData.length; l++) {
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          let value = this.layerData[l].data[y][x];
          if (value === 0) continue;
          let tile_x = Math.floor(x * worldMap.tilewidth - this.game.viewportX);
          let tile_y = Math.floor(
            y * worldMap.tileheight - this.game.viewportY
          );
          let tileSet;

          for (let i = 0; i < this.mapTilesets.length; i++) {
            if (this.mapTilesets[i].firstgid === value) {
              tileSet = this.mapTilesets[i];
              //console.log(tileSet);
              break;
            } else if (this.mapTilesets[i].firstgid > value) {
              tileSet = this.mapTilesets[i - 1];
              //console.log(tileSet);
              break;
            } else {
              tileSet = this.mapTilesets[i];
            }
          }
          //console.log(tileSet.name);
          /*
          console.log(
            "value: ",
            value,
            " x: ",
            (((value - tileSet.firstgid) * tileSet.tilewidth) %
              tileSet.imagewidth) *
              (this.frameX * 3),
            tileSet
          ); /*,
            " y: ",
            Math.floor(
              ((value - tileSet.firstgid) * tileSet.tilewidth) /
                (tileSet.columns * tileSet.tilewidth)
            ) * tileSet.tilewidth
          );*/
          if (tileSet.name === "foam" || tileSet.name === "foam2") {
            const xValue =
              ((value - tileSet.firstgid) * tileSet.tilewidth) %
              tileSet.imagewidth;
            ctx.drawImage(
              assets.images[tileSet.name].image,
              64 * this.frameX * 3 + xValue,
              Math.floor(
                ((value - tileSet.firstgid) * tileSet.tilewidth) /
                  (tileSet.columns * tileSet.tilewidth)
              ) * tileSet.tilewidth,
              64,
              64,
              tile_x,
              tile_y,
              64,
              64
            );
          } else {
            ctx.drawImage(
              assets.images[tileSet.name].image,
              ((value - tileSet.firstgid) * tileSet.tilewidth) %
                tileSet.imagewidth,
              Math.floor(
                ((value - tileSet.firstgid) * tileSet.tilewidth) /
                  (tileSet.columns * tileSet.tilewidth)
              ) * tileSet.tilewidth,
              64, //worldMap.tilewidth
              64,
              tile_x,
              tile_y,
              64,
              64
            );
          }
        }
      }
    }
  }
}
