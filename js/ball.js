class Ball {
  constructor(x, y) {
    this.radius = BALL_RADIUS;
    this.reset(x, y);
    this.baseSpeed = Math.floor(CANVAS_HEIGHT * 0.0025);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;

    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.dx = Math.abs(this.dx);
    } else if (this.x + this.radius >= CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.radius;
      this.dx = -Math.abs(this.dx);
    }

    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.dy = Math.abs(this.dy);
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
  }

  launch(paddleVelocity) {
    const angle = -Math.PI / 4 + (Math.random() * Math.PI) / 2;
    const speed = this.baseSpeed;

    this.dx = speed * Math.sin(angle);
    this.dy = -speed * Math.cos(angle);

    this.dx += paddleVelocity.x * 0.8;
  }

  bounceOffPaddle(paddle) {
    const paddleVelocity = paddle.getTotalVelocity();
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);

    let horizontalSpeed = this.dx;

    const velocityDiff = paddleVelocity.x - horizontalSpeed;
    horizontalSpeed += velocityDiff * 0.3;

    let verticalSpeed = Math.abs(this.dy);

    if (paddleVelocity.y < 0) {
      const speedBoost = Math.abs(paddleVelocity.y) * 0.8;
      verticalSpeed += speedBoost;
    }

    this.dx = horizontalSpeed;
    this.dy = -verticalSpeed;
  }

  increaseSpeed() {
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    const speedIncrease = this.baseSpeed * 0.02;
    const scale = (currentSpeed + speedIncrease) / currentSpeed;
    this.dx *= scale;
    this.dy *= scale;
  }
}
