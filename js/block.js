class Block {
  constructor(x, y, hits = 1) {
    this.x = x;
    this.y = y;
    this.size = BLOCK_SIZE;
    this.maxHits = hits;
    this.hits = hits;
    this.active = true;
    this.rotation =
      TRIANGLE_ROTATIONS[Math.floor(Math.random() * TRIANGLE_ROTATIONS.length)];
    this.points = getTrianglePoints(x, y, this.size, this.rotation);
  }

  hit() {
    this.hits--;
    if (this.hits <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    ctx.lineTo(this.points[1].x, this.points[1].y);
    ctx.lineTo(this.points[2].x, this.points[2].y);
    ctx.closePath();

    ctx.fillStyle = getBlockColor(this.hits - 1);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  checkCollision(ball) {
    if (!this.active) return null;

    // Проверяем, находится ли центр мяча достаточно близко к треугольнику
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.size + ball.radius) return null;

    // Проверяем столкновение с каждой стороной треугольника
    for (let i = 0; i < 3; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % 3];

      // Вектор от p1 к p2
      const edgeX = p2.x - p1.x;
      const edgeY = p2.y - p1.y;

      // Вектор от p1 к центру мяча
      const ballX = ball.x - p1.x;
      const ballY = ball.y - p1.y;

      // Проекция центра мяча на линию
      const dot =
        (ballX * edgeX + ballY * edgeY) / (edgeX * edgeX + edgeY * edgeY);
      const closestX = p1.x + dot * edgeX;
      const closestY = p1.y + dot * edgeY;

      // Проверяем, находится ли ближайшая точка на отрезке
      if (dot >= 0 && dot <= 1) {
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance <= ball.radius) {
          // Получаем нормаль к стороне
          const normal = getNormal(p1, p2);
          return {
            hit: true,
            normal: normal,
          };
        }
      }
    }

    // Проверяем столкновение с вершинами
    for (const point of this.points) {
      const dx = ball.x - point.x;
      const dy = ball.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= ball.radius) {
        return {
          hit: true,
          normal: {
            x: dx / distance,
            y: dy / distance,
          },
        };
      }
    }

    return null;
  }

  static createBlocks() {
    const blocks = [];
    const startX =
      (CANVAS_WIDTH - BLOCK_COLS * (BLOCK_SIZE + BLOCK_PADDING)) / 2;
    const startY = 50;

    for (let row = 0; row < BLOCK_ROWS; row++) {
      for (let col = 0; col < BLOCK_COLS; col++) {
        const x = startX + col * (BLOCK_SIZE + BLOCK_PADDING) + BLOCK_SIZE / 2;
        const y = startY + row * (BLOCK_SIZE + BLOCK_PADDING) + BLOCK_SIZE / 2;
        const hits = Math.min(5, Math.floor(row / 2) + 1);
        blocks.push(new Block(x, y, hits));
      }
    }

    return blocks;
  }
}
