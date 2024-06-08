export class Projectile {
  constructor(game, imageObject) {
    this.game = game;
    this.image = imageObject.image;
    this.source;
    this.x;
    this.y;
    this.spriteWidth = 64;
    this.spriteHeight = 64;
    this.scale = 0.5;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.baseline = this.y + this.height;
    this.speedX;
    this.speedY;
    this.targetX;
    this.targetY;
    this.angle = 0;
    this.speedModifier = 3;
    this.initialViewportX;
    this.initialViewportY;
    this.free = true;
  }

  start(source) {
    this.free = false;
    this.source = source;
    this.x = this.source.hitbox.x;
    this.y = this.source.hitbox.y;
    this.speedX = this.source.aim[0];
    this.speedY = this.source.aim[1];
    this.initialViewportX = this.game.viewportX;
    this.initialViewportY = this.game.viewportY;
  }

  reset() {
    this.source.shooting = false;
    this.free = true;
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

export class Dynamite extends Projectile {
  constructor(game, imageObject) {
    super(game, imageObject);
    this.scale = 0.65;
    this.width = this.spriteWidth * this.scale;
    this.height = this.spriteHeight * this.scale;
    this.hitbox = {
      x: 0,
      y: 0,
      hitboxRadius: 13,
    };
  }

  update(deltaTime) {
    if (this.free) return; //if not in use, dont update
    //move dynamite
    const diffX = this.game.viewportX - this.initialViewportX;
    const diffY = this.game.viewportY - this.initialViewportY;
    this.initialViewportX = this.game.viewportX;
    this.initialViewportY = this.game.viewportY;
    this.x += this.speedX * this.speedModifier - diffX;
    this.y += this.speedY * this.speedModifier - diffY;
    const dx = this.x - this.source.hitbox.x;
    const dy = this.y - this.source.hitbox.y;
    this.angle += 0.2;
    const distance = Math.hypot(dx, dy);
    this.frameTimer = 0;
    if (distance > this.source.searchRadius) this.reset();
  }

  draw(ctx) {
    if (this.free) return; //if not in use, dont update

    ctx.setTransform(
      Math.cos(this.angle),
      Math.sin(this.angle),
      -Math.sin(this.angle),
      Math.cos(this.angle),
      this.x,
      this.y
    );

    ctx.drawImage(
      this.image,
      0,
      0,
      this.spriteWidth,
      this.spriteHeight,
      (-this.spriteWidth * this.scale) / 2,
      (-this.spriteHeight * this.scale) / 2,
      this.width,
      this.height
    );

    if (this.game.debug) {
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
    //console.log(this.x);
    ctx.setTransform(1, 0, 0, 1, 0, 0); //reset
  }
}

export class Arrow extends Projectile {
  constructor(game, imageObject) {
    super(game, imageObject);
    this.source;
    this.hitbox = {
      x: 15,
      y: 3,
      hitboxRadius: 4,
    };
  }

  update() {
    if (this.free) return; //if not in use, dont update
    //move arrow
    if (this.frameTimer > this.frameInterval) {
      const diffX = this.game.viewportX - this.initialViewportX;
      const diffY = this.game.viewportY - this.initialViewportY;
      this.initialViewportX = this.game.viewportX;
      this.initialViewportY = this.game.viewportY;
      this.x += this.speedX * this.speedModifier - diffX;
      this.y += this.speedY * this.speedModifier - diffY;
      const dx = this.x - this.source.hitbox.x;
      const dy = this.y - this.source.hitbox.y;
      const distance = Math.hypot(dx, dy);
      this.frameTimer = 0;
      if (distance > this.source.searchRadius) this.reset();
    } else {
      this.frameTimer += deltaTime;
    }
  }

  draw(ctx) {
    if (this.free) return;
    //rotate arrow
    ctx.setTransform(
      Math.cos(this.angle),
      Math.sin(this.angle),
      -Math.sin(this.angle),
      Math.cos(this.angle),
      this.x,
      this.y
    ); /*
      console.log(
        this.game.height / 2 -
          this.game.playerChar.height / 2 -
          this.game.playerChar.y
      );*/
    ctx.drawImage(
      this.image,
      0,
      0,
      this.spriteWidth,
      this.spriteHeight,
      -12, //0, //this.x,
      -15, //this.y,
      this.width,
      this.height
    );
    if (this.game.debug) {
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
    //console.log(this.x);
    ctx.setTransform(1, 0, 0, 1, 0, 0); //reset
  }
}