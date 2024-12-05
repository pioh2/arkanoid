class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.lastRenderTime = performance.now();

    // Настройка размеров canvas
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  render(gameState) {
    // Очистка canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Отрисовка блоков
    gameState.blocks.forEach((block) => {
      if (block.active) {
        this.drawBlock(block);
      }
    });

    // Отрисовка платформы
    this.drawPaddle(gameState.paddle);

    // Отрисовка мяча
    this.drawBall(gameState.ball);

    // Обновляем время последнего рендера
    this.lastRenderTime = performance.now();
  }

  drawBlock(block) {
    const x = block.x * this.canvas.width;
    const y = block.y * this.canvas.height;
    const width = block.width * this.canvas.width;
    const height = block.height * this.canvas.height;

    this.ctx.fillStyle = "#4CAF50";
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = "#2E7D32";
    this.ctx.strokeRect(x, y, width, height);
  }

  drawPaddle(paddle) {
    const x = (paddle.x - paddle.width / 2) * this.canvas.width;
    const y = paddle.y * this.canvas.height;
    const width = paddle.width * this.canvas.width;
    const height = paddle.height * this.canvas.height;

    this.ctx.fillStyle = "#2196F3";
    this.ctx.fillRect(x, y, width, height);
  }

  drawBall(ball) {
    const x = ball.x * this.canvas.width;
    const y = ball.y * this.canvas.height;
    const radius = ball.radius * this.canvas.width;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#FF5722";
    this.ctx.fill();
    this.ctx.closePath();
  }

  createFlashEffect(x, y) {
    const flash = document.createElement("div");
    flash.className = "flash";
    flash.style.left = x + "px";
    flash.style.top = y + "px";
    document.body.appendChild(flash);

    flash.addEventListener("animationend", () => {
      flash.remove();
    });
  }
}
