class Paddle {
  constructor() {
    this.width = PADDLE_WIDTH;
    this.height = PADDLE_HEIGHT;
    this.reset();

    this.maxSpeed = Math.floor(CANVAS_WIDTH * 0.04);
    this.acceleration = Math.floor(CANVAS_WIDTH * 0.003);
    this.friction = 0.85;
    this.velocity = 0;

    this.baseY = CANVAS_HEIGHT - PADDLE_HEIGHT - 10;
    this.y = this.baseY;
    this.verticalVelocity = 0;
    this.jumpForce = CANVAS_HEIGHT * 0.005;
    this.gravity = CANVAS_HEIGHT * 0.0005;
    this.maxVerticalSpeed = CANVAS_HEIGHT * 0.01;
  }

  reset() {
    this.x = (CANVAS_WIDTH - this.width) / 2;
    this.y = this.baseY;
    this.velocity = 0;
    this.verticalVelocity = 0;
  }

  jump() {
    if (Math.abs(this.y - this.baseY) < 1) {
      this.verticalVelocity = -this.jumpForce;
    }
  }

  move(direction) {
    const speedFactor = Math.abs(this.velocity) / this.maxSpeed;
    const adjustedAcceleration = this.acceleration * (1 - speedFactor * 0.5);
    this.velocity += direction * adjustedAcceleration;

    this.velocity = clamp(this.velocity, -this.maxSpeed, this.maxSpeed);
  }

  update() {
    this.velocity *= this.friction;

    if (Math.abs(this.velocity) < 0.1) {
      this.velocity = 0;
    }

    this.x += this.velocity;

    this.x = clamp(this.x, 0, CANVAS_WIDTH - this.width);

    this.verticalVelocity += this.gravity;
    this.verticalVelocity = clamp(
      this.verticalVelocity,
      -this.maxVerticalSpeed,
      this.maxVerticalSpeed
    );
    this.y += this.verticalVelocity;

    if (this.y > this.baseY) {
      this.y = this.baseY;
      this.verticalVelocity = 0;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#4CAF50";
    ctx.fill();
    ctx.closePath();
  }

  getTotalVelocity() {
    return {
      x: this.velocity,
      y: this.verticalVelocity,
    };
  }
}
