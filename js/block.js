class Block {
  constructor(x, y, hits = 1) {
    this.width = BLOCK_WIDTH;
    this.height = BLOCK_HEIGHT;
    this.x = x;
    this.y = y;
    this.maxHits = hits;
    this.hits = hits;
    this.active = true;
  }

  hit() {
    this.hits--;
    if (this.hits <= 0) {
      this.active = false;
      return true; // блок уничтожен
    }
    return false;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = getBlockColor(this.hits - 1);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }

  static createBlocks() {
    const blocks = [];
    const startX =
      (CANVAS_WIDTH - BLOCK_COLS * (BLOCK_WIDTH + BLOCK_PADDING)) / 2;
    const startY = 50;

    for (let row = 0; row < BLOCK_ROWS; row++) {
      for (let col = 0; col < BLOCK_COLS; col++) {
        const x = startX + col * (BLOCK_WIDTH + BLOCK_PADDING);
        const y = startY + row * (BLOCK_HEIGHT + BLOCK_PADDING);
        const hits = BLOCK_ROWS - row;
        blocks.push(new Block(x, y, hits));
      }
    }

    return blocks;
  }
}
