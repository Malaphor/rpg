/** @type {HTMLCanvasElement} */
import Collisions, { Result } from "./assets/js/collisions/Collisions.mjs";
import { assets } from "./utils.js";
import Character from "./character.js";
import InputHandler from "./input.js";
import Map from "./Map.js";
import { worldMap } from "./assets/maps/map.js";
import { GoblinSign, Scarecrow, Tree } from "./NotInteractive.js";
import {
  ActiveGoldMine,
  Building,
  Castle,
  GoblinHouse,
  GoblinTower,
  House,
  InactiveGoldMine,
  Tower,
} from "./Buildings.js";
import { Resource, SheepResource, TreeResource } from "./Resources.js";
import {
  BuildingStates,
  Directions,
  PlayerState,
  SheepStates,
  TreeStates,
} from "./enums.js";
import { BuildMenu } from "./Menu.js";
import { Arrow, Dynamite, Projectile } from "./Projectile.js";
import { Barrel, Torch } from "./Enemy.js";

window.addEventListener("load", function () {
  console.log("loaded");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const CANVAS_WIDTH = (canvas.width = 768);
  const CANVAS_HEIGHT = (canvas.height = 576);

  //global variables
  let rafId = null;
  const pauseMenu = document.getElementById("pauseMenu");
  const defaultResources = { gold: 20, wood: 0, meat: 0 };
  let saveData = localStorage.getItem("tinySwordsSaveData");
  if (saveData === null) {
    saveData = defaultResources;
  } else {
    saveData = { ...defaultResources, ...JSON.parse(saveData) };
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.paused = false;
      this.viewportX = 0;
      this.viewportY = 0;
      this.worldWidth = worldMap.width * worldMap.tilewidth;
      this.worldHeight = worldMap.height * worldMap.tileheight;
      this.debug = true;
      this.dirKeys = {
        h: { val: 0, key: undefined },
        v: { val: 0, key: undefined },
      };
      this.currentLevel = 1;
      this.collisionSystem = [new Collisions(), new Collisions()];
      this.collidableObjects = new Collisions();
      this.collisionResult = new Result();
      this.playerChar = new Character(this, assets.images.warriorBlue);
      this.input = new InputHandler(this);
      this.allGameObjects = [];
      this.numArchers = 0;
      this.numTntGoblins = 0;
      //this.archers = [];
      this.arrowPool = [];
      this.dynamitePool = [];
      this.torchEnemyPool = [];
      this.barrelEnemyPool = [];
      //this.createArchers();
      this.nearYedge = false;
      this.nearXedge = false;
      this.map = new Map(this);
      this.buildMenu = new BuildMenu(this);
      this.notInteractiveObjects = [];
      this.createNIO(); //not interactive objects
      this.buildings = [];
      this.createBuildings();
      this.createProjectilePool();
      this.inventory = [
        {
          name: "gold",
          quantity: saveData.gold,
          image: assets.images.gold.image,
        },
        {
          name: "wood",
          quantity: saveData.wood,
          image: assets.images.wood.image,
        },
        {
          name: "meat",
          quantity: saveData.meat,
          image: assets.images.meat.image,
        },
      ];
      this.sheep = [];
      this.trees = [];
      this.createResources();
    }

    render(ctx, deltaTime) {
      this.map.update(deltaTime);
      this.map.draw(ctx);
      this.allGameObjects = [
        this.playerChar,
        ...this.buildings,
        ...this.notInteractiveObjects,
        ...this.trees,
        ...this.sheep,
        ...this.torchEnemyPool,
        ...this.barrelEnemyPool,
      ];
      this.allGameObjects.sort((a, b) => {
        a.baseline && b.baseline
          ? a.baseline - b.baseline
          : a.y + a.height - (b.y + b.height);
      });
      this.allGameObjects = [
        ...this.allGameObjects,
        ...this.arrowPool,
        ...this.dynamitePool,
      ];
      for (const object of this.allGameObjects) {
        //if (object !== this.playerChar && !object.isInView()) continue;
        object.update(deltaTime);
      }

      this.updateCollisionBodyPositions();
      this.collisionSystem[this.currentLevel].update();
      this.collidableObjects.update();
      this.handleCollisions();

      this.allGameObjects.forEach((object) => {
        object.draw(ctx);
        //console.log(this.playerChar.currentState);
        if (
          object !== this.playerChar &&
          this.playerChar.currentState ===
            this.playerChar.states[PlayerState.ATTACK] &&
          object.hitbox &&
          !(object instanceof Projectile)
        ) {
          //console.log(object.hitbox);
          this.checkPlayerAttackCollision(this.playerChar, object);
        }
        if (
          (object instanceof TreeResource &&
            object.currentState === object.states[TreeStates.DEAD]) ||
          (object instanceof SheepResource &&
            object.currentState === object.states[SheepStates.DEAD])
        ) {
          if (this.isNearResource(object)) {
            object.resource.button.visible = true;
          } else {
            object.resource.button.visible = false;
          }
        }
        if (
          object instanceof Building &&
          object.button &&
          object.currentState === object.states[BuildingStates.BROKEN]
        ) {
          if (this.isNearBrokenBuilding(object)) {
            object.button.visible = true;
          } else {
            object.button.visible = false;
          }
        }
      }); /*
      this.arrowPool.forEach((arrow) => {
        arrow.draw(ctx);
        arrow.update();
      });*/
      this.buildMenu.update(deltaTime);
      this.buildMenu.draw(ctx);
      this.drawInventory(ctx);
      if (this.debug) this.renderCollisionBodies(ctx);
    }

    //only for collision layers, objects handled on objects
    updateCollisionBodyPositions() {
      for (let i = 0; i < this.map.collisionOriginsData[0].length; i++) {
        const object = this.collisionSystem[0]._bvh._bodies[i];
        if (object.radius) {
          //object with radius is the player
        } else {
          if (!this.nearYedge) {
            object.y = this.map.collisionOriginsData[0][i][1] - this.viewportY;
          }
          if (!this.nearXedge) {
            object.x = this.map.collisionOriginsData[0][i][0] - this.viewportX;
          }
        }
      }
      for (let i = 0; i < this.map.collisionOriginsData[1].length; i++) {
        const object = this.collisionSystem[1]._bvh._bodies[i];
        if (object.radius) {
          //object with radius is the player
        } else {
          if (!this.nearYedge) {
            object.y = this.map.collisionOriginsData[1][i][1] - this.viewportY;
          }
          if (!this.nearXedge) {
            object.x = this.map.collisionOriginsData[1][i][0] - this.viewportX;
          }
        }
      }
    }

    handleCollisions() {
      const player = this.playerChar.collisionBody;
      //console.log(player);
      let potentials = player.potentials();

      for (const body of potentials) {
        //check for stairs
        if (this.currentLevel === 0) {
          if (this.map.levelIncreaseLines.includes(body)) {
            this.currentLevel = 1;
            this.collisionSystem[0].remove(player);
            this.collisionSystem[1].insert(player);
            return;
          }
        } else {
          if (this.map.levelDecreaseLines.includes(body)) {
            this.currentLevel = 0;
            this.collisionSystem[1].remove(player);
            this.collisionSystem[0].insert(player);
            return;
          }
        }
        if (player.collides(body, this.collisionResult)) {
          this.playerChar.x -=
            this.collisionResult.overlap * this.collisionResult.overlap_x;
          this.playerChar.y -=
            this.collisionResult.overlap * this.collisionResult.overlap_y;
        }
      }

      this.collisionSystem[this.currentLevel].remove(player);
      this.collidableObjects.insert(player);
      potentials = player.potentials();

      for (const body of potentials) {
        if (player.collides(body, this.collisionResult)) {
          this.playerChar.x -=
            this.collisionResult.overlap * this.collisionResult.overlap_x;
          this.playerChar.y -=
            this.collisionResult.overlap * this.collisionResult.overlap_y;
        }
      }

      this.collidableObjects.remove(player);
      this.collisionSystem[this.currentLevel].insert(player);
    }

    renderCollisionBodies(ctx) {
      ctx.strokeStyle = "#FFFFFF";
      //ctx.lineWidth = 5;
      ctx.beginPath();
      this.collisionSystem[this.currentLevel].draw(ctx);
      ctx.stroke();
    }
    /*
    createArchers() {
      for (let i = 0; i < this.numArchers; i++) {
        this.archers.push(new Archer(this, assets.images.archerBlue));
      }
    }*/

    createProjectilePool() {
      for (let i = 0; i < this.numArchers; i++) {
        this.arrowPool.push(new Arrow(this, assets.images.arrow));
      }
      for (let i = 0; i < this.numTntGoblins; i++) {
        this.dynamitePool.push(new Dynamite(this, assets.images.dynamite));
      }
    }

    createNIO() {
      const nioLayers = worldMap.layers.filter(
        (layer) => layer.name === "foreground" || layer.name === "foreground2"
      );
      //console.log(nioLayers);
      nioLayers.forEach((nioLayer) => {
        const data = []; //2D array of tiles
        for (let i = 0; i < nioLayer.data.length; i += 60) {
          data.push(nioLayer.data.slice(i, i + 60));
        }

        for (let y = 0; y < data.length; y++) {
          for (let x = 0; x < data[y].length; x++) {
            if (data[y][x] === 0) {
              continue;
            } else if (data[y][x] === 106) {
              //first tree tile
              this.notInteractiveObjects.push(
                new Tree(this, assets.images.tree, x * 64, y * 64)
              );
            } else if (data[y][x] === 386) {
              //first goblin sign tile
              this.notInteractiveObjects.push(
                new GoblinSign(this, assets.images.redSign, x * 64, y * 64)
              );
            } else if (data[y][x] === 400) {
              //first scarecrow tile
              this.notInteractiveObjects.push(
                new Scarecrow(this, assets.images.scarecrow, x * 64, y * 64)
              );
            }
          }
        }
      });
    }

    createResources() {
      const resourceLayer = worldMap.layers.find(
        (layer) => layer.name === "resources"
      );
      //console.log(nioLayers);
      const data = []; //2D array of tiles
      for (let i = 0; i < resourceLayer.data.length; i += 60) {
        data.push(resourceLayer.data.slice(i, i + 60));
      }

      for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[y].length; x++) {
          if (data[y][x] === 0) {
            continue;
          } else if (data[y][x] === 106) {
            //first tree tile
            this.trees.push(
              new TreeResource(this, x * 64, y * 64, assets.images.tree)
            );
          } else if (data[y][x] === 410) {
            //first sheep tile
            this.sheep.push(
              new SheepResource(this, x * 64, y * 64, assets.images.sheep)
            );
          }
        }
      }
    }

    createBuildings() {
      //building layer also contains goblin spawn points
      const layer = worldMap.layers.find((layer) => layer.name === "buildings");
      const data = [];
      for (let i = 0; i < layer.data.length; i += 60) {
        data.push(layer.data.slice(i, i + 60));
      }

      for (let y = 0; y < data.length; y++) {
        for (let x = 0; x < data[y].length; x++) {
          if (data[y][x] === 0) {
            continue;
          } else if (data[y][x] === 294) {
            //first house tile
            this.buildings.push(
              new House(
                this,
                assets.images.House_Blue,
                assets.images.brokenHouse,
                assets.images.buildingHouse,
                x * 64,
                y * 64
              )
            );
          } else if (data[y][x] === 300) {
            //first tower tile
            this.buildings.push(
              new Tower(
                this,
                assets.images.Tower_Blue,
                assets.images.brokenTower,
                assets.images.buildingTower,
                x * 64,
                y * 64
              )
            );
            this.numArchers++;
          } else if (data[y][x] === 86) {
            //first blue castle tile
            this.buildings.push(
              new Castle(
                this,
                assets.images.castle,
                assets.images.brokenCastle,
                x * 64,
                y * 64
              )
            );
          } else if (data[y][x] === 214) {
            //first goblin house tile
            this.buildings.push(
              new GoblinHouse(
                this,
                assets.images.goblinHouse,
                assets.images.brokenGoblinHouse,
                x * 64,
                y * 64
              )
            );
          } else if (data[y][x] === 220) {
            //first goblin tower tile
            this.buildings.push(
              new GoblinTower(
                this,
                assets.images.goblinTower,
                assets.images.brokenGoblinTower,
                x * 64,
                y * 64
              )
            );
            this.numTntGoblins++;
          } else if (data[y][x] === 268) {
            //first red castle tile
            this.buildings.push(
              new Castle(
                this,
                assets.images.redCastle,
                assets.images.brokenCastle,
                x * 64,
                y * 64
              )
            );
          } else if (data[y][x] === 288) {
            //first inactive gold mine tile
            this.buildings.push(
              new InactiveGoldMine(
                this,
                assets.images.GoldMine_Inactive,
                x * 64,
                y * 64
              )
            );
          } else if (data[y][x] === 380) {
            //first active gold mine tile
            this.buildings.push(
              new ActiveGoldMine(
                this,
                assets.images.GoldMine_Active,
                x * 64,
                y * 64
              )
            );
          } else if (data[y][x] === 474) {
            //torch spawn points
            this.torchEnemyPool.push(
              new Torch(this, assets.images.torchRed, x * 64, y * 64)
            );
          } else if (data[y][x] === 475) {
            //barrel spawn points
            this.barrelEnemyPool.push(
              new Barrel(this, assets.images.barrelRed, x * 64, y * 64)
            );
          }
        }
      }
    }

    calcDistAngle(a, b) {
      //const dx = a.x - a.width / 4 - b.x;
      //const dy = a.y - a.height / 4 - b.y;
      const dx = a.hitbox.x - b.hitbox.x;
      const dy = a.hitbox.y - b.hitbox.y;
      const distance = Math.hypot(dx, dy);
      const aimX = dx / distance;
      const aimY = dy / distance;
      return [aimX, aimY, dx, dy, distance];
    }

    checkPlayerAttackCollision(char, b) {
      if (
        b instanceof TreeResource ||
        b instanceof SheepResource ||
        b instanceof Tower ||
        b instanceof GoblinHouse
      ) {
        //arc vs circle
        if (b.isInView() && !b.isBeingAttacked) {
          //console.log(char, b);
          const dx = char.hitbox.x - b.hitbox.x;
          const dy = char.hitbox.y - b.hitbox.y;
          const distance = Math.hypot(dx, dy);
          const sumOfRadii = char.hitbox.attackRadius + b.hitbox.hitboxRadius;
          /*console.log(
          dx,
          dy,
          distance,
          sumOfRadii,
          b.hitbox.x - this.viewportX,
          b.hitbox.y - this.viewportY
        );*/
          //console.log(distance, sumOfRadii);
          if (distance < sumOfRadii) {
            let enemyAngle =
              dx > 0
                ? Math.atan2(dy, dx) + Math.PI
                : Math.atan2(Math.abs(dy), Math.abs(dx)) % (2 * Math.PI);
            //if (dy < char.hitbox.attackRadius && dy > 0) enemyAngle += Math.PI;
            const { startAngle, endAngle } = char.getHitboxAngles();
            //console.log(startAngle, endAngle, enemyAngle, dy);
            if (enemyAngle >= startAngle && enemyAngle <= endAngle) {
              b.isBeingAttacked = true;
              if (b instanceof Tower || b instanceof GoblinHouse) {
                b.health -= char.attackDamage;
              }
            }
          }
        }
      } else if (
        b instanceof House ||
        b instanceof Castle ||
        b instanceof GoblinTower
      ) {
        //arc vs square
        if (!b.isInView() || b.isBeingAttacked) return;

        let didHitBuilding = false;
        let horizontal = true;
        let startY = 0;
        let startX = 0;
        const { startAngle, endAngle } = char.getHitboxAngles();
        if (char.lastKey === Directions.RIGHT) {
          didHitBuilding =
            char.hitbox.x + char.hitbox.attackRadius > b.hitbox.x &&
            char.hitbox.x + char.hitbox.attackRadius <
              b.hitbox.x + b.hitbox.width;
          startY =
            char.hitbox.y + Math.sin(startAngle) * char.hitbox.attackRadius;
        } else if (char.lastKey === Directions.LEFT) {
          didHitBuilding =
            char.hitbox.x - char.hitbox.attackRadius > b.hitbox.x &&
            char.hitbox.x - char.hitbox.attackRadius <
              b.hitbox.x + b.hitbox.width;
          startY =
            char.hitbox.y - Math.sin(startAngle) * char.hitbox.attackRadius;
        } else if (char.lastKey === Directions.DOWN) {
          didHitBuilding =
            char.hitbox.y + char.hitbox.attackRadius > b.hitbox.y &&
            char.hitbox.y + char.hitbox.attackRadius <
              b.hitbox.y + b.hitbox.height;
          startX =
            char.hitbox.x + Math.sin(startAngle) * char.hitbox.attackRadius;
          horizontal = false;
        } else if (char.lastKey === Directions.UP) {
          didHitBuilding =
            char.hitbox.y - char.hitbox.attackRadius > b.hitbox.y &&
            char.hitbox.y - char.hitbox.attackRadius <
              b.hitbox.y + b.hitbox.height;
          startX =
            char.hitbox.x -
            (Math.sin(startAngle) * char.hitbox.attackRadius) / 2;
          horizontal = false;
        }

        if (didHitBuilding) {
          const endXY = horizontal
            ? char.hitbox.y + Math.sin(endAngle) * char.hitbox.attackRadius
            : char.hitbox.x +
              (Math.sin(endAngle) * char.hitbox.attackRadius) / 2;
          if (
            (horizontal &&
              b.hitbox.y < endXY &&
              b.hitbox.y + b.hitbox.height > startY) ||
            (b.hitbox.x < endXY && b.hitbox.x + b.hitbox.width > startX)
          ) {
            //console.log("hit");
            b.health -= char.attackDamage;
            b.isBeingAttacked = true;
          }
        }
      }
    }

    getProjectile(type) {
      if (type === "arrow") {
        for (let i = 0; i < this.arrowPool.length; i++) {
          if (this.arrowPool[i].free) return this.arrowPool[i];
        }
      }
      if (type === "dynamite") {
        for (let i = 0; i < this.dynamitePool.length; i++) {
          if (this.dynamitePool[i].free) return this.dynamitePool[i];
        }
      }
    }

    drawInventory(ctx) {
      this.inventory.forEach((item, index) => {
        const q = 55;
        ctx.drawImage(item.image, 0, 0, 128, 128, index * q, -5, 50, 50);
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.font = "14px sans-serif";
        ctx.fillText("x" + item.quantity, index * q + 40, 32);
      });
    }

    isNearResource(resource) {
      const dx =
        this.playerChar.hitbox.x - (resource.resource.x - this.viewportX);
      const dy =
        this.playerChar.hitbox.y - (resource.resource.y - this.viewportY);
      const distance = Math.hypot(dx, dy);
      const sumOfRadii =
        this.playerChar.hitbox.attackRadius + resource.resource.width;
      if (distance < sumOfRadii) {
        return true;
      }
      return false;
    }

    isNearBrokenBuilding(object) {
      if (object.currentState !== object.states[BuildingStates.BROKEN])
        return false;
      const dx =
        object.x + object.width / 2 - this.viewportX - this.playerChar.hitbox.x;
      const dy =
        object.y +
        object.height / 2 -
        this.viewportY -
        this.playerChar.hitbox.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 140) {
        return true;
      }
      return false;
    }

    doAnAction() {
      const objects = [...this.trees, ...this.sheep, ...this.buildings];
      objects.forEach((object) => {
        if (object.isInView()) {
          if (object instanceof House || object instanceof Tower) {
            if (
              object.currentState === object.states[BuildingStates.BROKEN] &&
              this.isNearBrokenBuilding(object)
            ) {
              this.buildMenu.show(object);
            }
          } else if (
            object instanceof TreeResource ||
            object instanceof SheepResource
          ) {
            if (object.resource.visible && this.isNearResource(object)) {
              object.resource.addToInventory(object.resource);
            }
          }
        }
      });
    }

    playPause() {
      if (game.paused) {
        pauseMenu.style.display = "none";
        game.paused = false;
        rafId = requestAnimationFrame(drawLoop);
      } else {
        if (rafId) cancelAnimationFrame(rafId);
        game.paused = true;
        pauseMenu.style.display = "block";
      }
    }
  }

  const game = new Game(CANVAS_WIDTH, CANVAS_HEIGHT);

  let lastTime = 0;
  function drawLoop(timeStamp) {
    if (game.paused) return;
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    game.render(ctx, deltaTime);
    rafId = requestAnimationFrame(drawLoop);
  }
  drawLoop(0);
});
