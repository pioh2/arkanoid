class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext("2d");

    this.paddle = new Paddle();
    this.ball = null;
    this.blocks = Block.createBlocks();

    this.score = 0;
    this.lives = 3;
    this.gameLoop = null;
    this.keys = {};
    this.isPlaying = false;

    this.sounds = {
      paddleHit: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2661/2661-preview.mp3"
      ),
      blockHit: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2582/2582-preview.mp3"
      ),
      blockBreak: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2580/2580-preview.mp3"
      ),
      wallHit: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.mp3"
      ),
      lose: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/146/146-preview.mp3"
      ),
      gameOver: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3"
      ),
      victory: new Audio(
        "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3"
      ),
    };

    Object.values(this.sounds).forEach((sound) => {
      sound.load();
      sound.volume = 0.9;
    });

    this.sounds.gameOver.volume = 0.7;
    this.sounds.lose.volume = 1.0;

    this.setupEventListeners();
    this.initGame();
  }

  initGame() {
    this.paddle.reset();
    this.ball = new Ball(
      this.paddle.x + this.paddle.width / 2,
      this.paddle.y - BALL_RADIUS
    );
    showScreen("start-screen");
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
      if (e.code === "Space") {
        if (!this.isPlaying) {
          this.isPlaying = true;
          this.ball.launch(this.paddle.getTotalVelocity());
        }
        this.paddle.jump();
      }
    });
    document.addEventListener("keyup", (e) => (this.keys[e.key] = false));

    document
      .getElementById("start-button")
      .addEventListener("click", () => this.start());
    document
      .getElementById("restart-button")
      .addEventListener("click", () => this.restart());
  }

  start() {
    showScreen("game-screen");
    this.isPlaying = false;
    if (!this.gameLoop) {
      this.gameLoop = requestAnimationFrame(() => this.update());
    }
  }

  restart() {
    this.paddle.reset();
    this.ball = new Ball(
      this.paddle.x + this.paddle.width / 2,
      this.paddle.y - BALL_RADIUS
    );
    this.blocks = Block.createBlocks();
    this.score = 0;
    this.lives = 3;
    this.isPlaying = false;
    this.updateScore();
    this.updateLives();
    this.start();
  }

  createFlashEffect(x, y) {
    const flash = document.createElement("div");
    flash.className = "flash";
    flash.style.left = x + "px";
    flash.style.top = y + "px";
    document.body.appendChild(flash);

    flash.addEventListener("animationend", () => {
      document.body.removeChild(flash);
    });
  }

  createBorderFlash() {
    const flash = document.createElement("div");
    flash.className = "border-flash";
    document.body.appendChild(flash);

    flash.offsetHeight;

    flash.classList.add("active");
    flash.addEventListener("animationend", () => {
      document.body.removeChild(flash);
    });
  }

  createScreenFlash(type) {
    const flash = document.createElement("div");
    flash.className = `screen-flash ${type}`;
    document.body.appendChild(flash);

    flash.addEventListener("animationend", () => {
      document.body.removeChild(flash);
    });
  }

  playSound(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  update() {
    this.handleInput();
    this.paddle.update();

    if (this.isPlaying) {
      this.ball.update();

      if (
        this.ball.x - this.ball.radius <= 0 ||
        this.ball.x + this.ball.radius >= CANVAS_WIDTH ||
        this.ball.y - this.ball.radius <= 0
      ) {
        this.createBorderFlash();
        this.playSound("wallHit");
      }
    } else {
      this.ball.x = this.paddle.x + this.paddle.width / 2;
      this.ball.y = this.paddle.y - BALL_RADIUS;
    }

    if (this.isPlaying && Collision.checkCircleRect(this.ball, this.paddle)) {
      this.ball.y = this.paddle.y - this.ball.radius;
      this.ball.bounceOffPaddle(this.paddle);
      this.createFlashEffect(this.ball.x, this.ball.y);
      this.playSound("paddleHit");
    }

    for (const block of this.blocks) {
      if (block.active && Collision.checkCircleRect(this.ball, block)) {
        const collision = Collision.resolveCircleRect(this.ball, block);
        if (collision.side === "horizontal") {
          this.ball.dx = -this.ball.dx;
        } else {
          this.ball.dy = -this.ball.dy;
        }

        this.createFlashEffect(this.ball.x, this.ball.y);

        if (block.hit()) {
          this.score += block.maxHits * 10;
          this.updateScore();
          this.ball.increaseSpeed();
          this.playSound("blockBreak");
        } else {
          this.playSound("blockHit");
        }
        break;
      }
    }

    if (this.ball.y + this.ball.radius > CANVAS_HEIGHT) {
      this.lives--;
      this.updateLives();
      this.createScreenFlash("miss");
      this.playSound("lose");

      if (this.lives <= 0) {
        this.gameOver(false);
      } else {
        this.isPlaying = false;
        this.ball.reset(
          this.paddle.x + this.paddle.width / 2,
          this.paddle.y - BALL_RADIUS
        );
      }
    }

    if (this.blocks.every((block) => !block.active)) {
      this.gameOver(true);
    }

    this.draw();
    if (this.gameLoop) {
      this.gameLoop = requestAnimationFrame(() => this.update());
    }
  }

  handleInput() {
    if (this.keys["ArrowLeft"] || this.keys["a"]) {
      this.paddle.move(-1);
    }
    if (this.keys["ArrowRight"] || this.keys["d"]) {
      this.paddle.move(1);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.blocks.forEach((block) => block.draw(this.ctx));
    this.paddle.draw(this.ctx);
    if (this.ball) {
      this.ball.draw(this.ctx);
    }
  }

  updateScore() {
    document.getElementById("score").textContent = this.score;
    document.getElementById("final-score").textContent = this.score;
  }

  updateLives() {
    document.getElementById("lives").textContent = this.lives;
  }

  gameOver(won = false) {
    this.gameLoop = null;
    showScreen("game-over-screen");
    const gameOverTitle = document.querySelector("#game-over-screen h2");

    if (won) {
      gameOverTitle.textContent = "Победа!";
      this.createScreenFlash("victory");
      this.playSound("victory");
    } else {
      gameOverTitle.textContent = "Игра окончена";
      this.createScreenFlash("game-over");
      this.playSound("gameOver");
    }
  }
}

// Запускаем игру
window.addEventListener("load", () => {
  new Game();
});
