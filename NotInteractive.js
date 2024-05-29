import { Circle } from "./assets/js/collisions/Collisions.mjs";

class NotInteractiveObject {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.tileWidth = 64;
  }

  draw(ctx) {
    if (this.isInView() === false) return;
    ctx.drawImage(
      this.image,
      this.frameX * this.width,
      0,
      this.width,
      this.height,
      this.x - this.game.viewportX,
      this.y - this.game.viewportY,
      this.width,
      this.height
    );
    //debug hitbox
    if (this.game.debug && this.hitbox) {
      ctx.beginPath();
      ctx.arc(
        this.hitbox.x,
        this.hitbox.y,
        this.hitbox.hitboxRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  isInView() {
    if (
      this.x + this.width < this.game.viewportX ||
      this.x > this.game.viewportX + this.game.width
    )
      return false;
    if (
      this.y + this.height < this.game.viewportY ||
      this.y > this.game.viewportY + this.game.height
    )
      return false;
    return true;
  }
}

export class Tree extends NotInteractiveObject {
  constructor(game, imageObject, x, y) {
    super(game, x, y);
    this.image = imageObject.image;
    this.width = 3 * this.tileWidth;
    this.height = 3 * this.tileWidth;
    this.xOffset = this.width / 2;
    this.yOffset = this.height - 32;
    this.hitbox = {
      x: this.x + this.xOffset,
      y: this.y + this.yOffset,
      hitboxRadius: 14,
    };
    this.collisionBody = new Circle(
      this.hitbox.x,
      this.hitbox.y,
      this.hitbox.hitboxRadius
    );
    this.game.collidableObjects.insert(this.collisionBody);
    this.baseline = this.hitbox.y + this.hitbox.hitboxRadius;
    this.spriteFrames = 3;
    this.frameX = 0;
    this.fps = 10 + Math.random() * 5;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
  }

  update(deltaTime) {
    if (this.isInView() === false) return;
    this.hitbox.x = this.x + this.xOffset - this.game.viewportX;
    this.hitbox.y = this.y + this.yOffset - this.game.viewportY;
    this.collisionBody.x = this.x + this.xOffset - this.game.viewportX;
    this.collisionBody.y = this.y + this.yOffset - this.game.viewportY;
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
}

export class GoblinSign extends NotInteractiveObject {
  constructor(game, imageObject, x, y) {
    super(game, x, y);
    this.image = imageObject.image;
    this.width = this.tileWidth;
    this.height = 2 * this.tileWidth;
    this.frameX = 0;
  }

  update() {
    //
  }
}

export class Scarecrow extends NotInteractiveObject {
  constructor(game, imageObject, x, y) {
    super(game, x, y);
    this.image = imageObject.image;
    this.width = 3 * this.tileWidth;
    this.height = 3 * this.tileWidth;
    this.frameX = 0;
  }

  update() {
    //
  }
}

export class Plant extends NotInteractiveObject {
  constructor(game, imageObject, x, y) {
    super(game, x, y);
    this.image = imageObject.image;
    this.width = this.tileWidth;
    this.height = this.tileWidth;
    this.frameX = 0;
  }

  update() {
    //
  }
}
