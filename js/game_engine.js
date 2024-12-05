class GameEngine {
  constructor() {
    // Состояние игры
    this.state = {
      paddle: {
        x: 0.5,
        y: 0.9,
        vx: 0,
        vy: 0,
        width: 0.2,
        height: 0.02,
      },
      ball: {
        x: 0.5,
        y: 0.85,
        dx: 0,
        dy: 0,
        radius: 0.01,
        speed: 0.4,
        isLaunched: false,
      },
      blocks: [],
      score: 0,
      lives: 3,
      gameOver: false,
      victory: false,
      lastStepTime: performance.now(),
      accumulatedTime: 0,
    };

    // Константы
    this.TIMESTEP = 1; // 1ms фиксированный шаг
    this.MAX_ACCUMULATED_TIME = 200; // Максимальное время для наверстывания
    this.PADDLE_SPEED = 0.5;
    this.PADDLE_JUMP_SPEED = 0.3;
    this.GRAVITY = 0.001;

    // Инициализация блоков
    this.initBlocks();
  }

  initBlocks() {
    this.state.blocks = [];
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 24; col++) {
        this.state.blocks.push({
          x: col / 24,
          y: row / 12,
          width: 1 / 24,
          height: 1 / 12,
          active: true,
        });
      }
    }
  }

  reset() {
    this.state.paddle.x = 0.5;
    this.state.paddle.y = 0.9;
    this.state.paddle.vx = 0;
    this.state.paddle.vy = 0;
    this.state.ball.x = this.state.paddle.x;
    this.state.ball.y = this.state.paddle.y - 0.05;
    this.state.ball.dx = 0;
    this.state.ball.dy = 0;
    this.state.ball.isLaunched = false;
    this.state.score = 0;
    this.state.lives = 3;
    this.state.gameOver = false;
    this.state.victory = false;
    this.initBlocks();
  }

  // Основной метод обновления состояния
  update(dt, action = null) {
    // Обработка действий
    if (action !== null) {
      this.handleAction(action);
    }

    // Обновление физики
    this.updatePhysics(dt);

    // Проверка коллизий
    this.checkCollisions();

    // Проверка условий окончания игры
    this.checkGameConditions();

    return {
      state: this.getState(),
      reward: this.calculateReward(),
    };
  }

  handleAction(action) {
    switch (action) {
      case -1: // влево
        this.state.paddle.vx = -this.PADDLE_SPEED;
        break;
      case 1: // вправо
        this.state.paddle.vx = this.PADDLE_SPEED;
        break;
      case 0: // стоп
        this.state.paddle.vx = 0;
        break;
      case 2: // прыжок
        if (this.state.paddle.y >= 0.9) {
          this.state.paddle.vy = -this.PADDLE_JUMP_SPEED;
        }
        break;
      case 3: // запуск мяча
        if (!this.state.ball.isLaunched) {
          this.state.ball.isLaunched = true;
          this.state.ball.dx = 0.2;
          this.state.ball.dy = -this.state.ball.speed;
        }
        break;
    }
  }

  updatePhysics(dt) {
    const dtSeconds = dt / 1000;

    // Обновление платформы
    this.state.paddle.x += this.state.paddle.vx * dtSeconds;
    this.state.paddle.y += this.state.paddle.vy * dtSeconds;
    this.state.paddle.vy += this.GRAVITY * dtSeconds;

    // Ограничения для платформы
    this.state.paddle.x = Math.max(
      this.state.paddle.width / 2,
      Math.min(1 - this.state.paddle.width / 2, this.state.paddle.x)
    );
    this.state.paddle.y = Math.min(Math.max(0, this.state.paddle.y), 0.9);
    if (this.state.paddle.y >= 0.9) {
      this.state.paddle.vy = 0;
    }

    // Обновление мяча
    if (this.state.ball.isLaunched) {
      this.state.ball.x += this.state.ball.dx * dtSeconds;
      this.state.ball.y += this.state.ball.dy * dtSeconds;
    } else {
      this.state.ball.x = this.state.paddle.x;
      this.state.ball.y = this.state.paddle.y - 0.05;
    }
  }

  checkCollisions() {
    // Коллизии мяча со стенами
    if (
      this.state.ball.x <= this.state.ball.radius ||
      this.state.ball.x >= 1 - this.state.ball.radius
    ) {
      this.state.ball.dx *= -1;
    }
    if (this.state.ball.y <= this.state.ball.radius) {
      this.state.ball.dy *= -1;
    }

    // Коллизия с платформой
    if (
      this.state.ball.y >= this.state.paddle.y - this.state.ball.radius &&
      this.state.ball.y <= this.state.paddle.y + this.state.paddle.height &&
      Math.abs(this.state.ball.x - this.state.paddle.x) <
        this.state.paddle.width / 2
    ) {
      this.state.ball.dy = -this.state.ball.speed;
      // Изменение угла отскока в зависимости от места удара
      const hitPoint =
        (this.state.ball.x -
          (this.state.paddle.x - this.state.paddle.width / 2)) /
        this.state.paddle.width;
      this.state.ball.dx = (hitPoint - 0.5) * this.state.ball.speed * 2;
    }

    // Коллизии с блоками
    for (let block of this.state.blocks) {
      if (!block.active) continue;

      if (
        this.state.ball.y >= block.y &&
        this.state.ball.y <= block.y + block.height &&
        this.state.ball.x >= block.x &&
        this.state.ball.x <= block.x + block.width
      ) {
        block.active = false;
        this.state.score += 100;
        this.state.ball.dy *= -1;
      }
    }
  }

  checkGameConditions() {
    // Проверка пропуска мяча
    if (this.state.ball.y > 1) {
      this.state.lives--;
      if (this.state.lives <= 0) {
        this.state.gameOver = true;
      } else {
        this.resetBall();
      }
    }

    // Проверка победы
    if (this.state.blocks.every((block) => !block.active)) {
      this.state.victory = true;
    }
  }

  resetBall() {
    this.state.ball.isLaunched = false;
    this.state.ball.x = this.state.paddle.x;
    this.state.ball.y = this.state.paddle.y - 0.05;
    this.state.ball.dx = 0;
    this.state.ball.dy = 0;
  }

  calculateReward() {
    let reward = 0;

    // Штраф за пропуск мяча
    if (this.state.ball.y > 1) {
      reward -= 5.0;
    }

    // Награда за отбивание мяча
    if (
      this.state.ball.dy < 0 &&
      Math.abs(this.state.ball.y - this.state.paddle.y) < 0.02
    ) {
      reward += 0.5;
    }

    // Награда за уничтожение блока (добавляется в checkCollisions)
    // reward += 1.0 за каждый уничтоженный блок

    // Награда/штраф за окончание игры
    if (this.state.victory) {
      reward += 10.0;
    }
    if (this.state.gameOver) {
      reward -= 10.0;
    }

    // Штраф за неактивность
    if (!this.state.ball.isLaunched) {
      reward -= 0.01;
    }

    return reward;
  }

  getState() {
    return {
      paddle: { ...this.state.paddle },
      ball: { ...this.state.ball },
      blocks: this.state.blocks.map((block) => ({ ...block })),
      score: this.state.score,
      lives: this.state.lives,
      gameOver: this.state.gameOver,
      victory: this.state.victory,
    };
  }
}

// Экспорт для использования и в браузере, и в Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = GameEngine;
} else {
  window.GameEngine = GameEngine;
}
