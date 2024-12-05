class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.engine = new GameEngine();
    this.renderer = new GameRenderer(this.canvas);

    this.aiEnabled = false;
    this.ws = null;
    this.lastUpdateTime = performance.now();
    this.accumulatedTime = 0;
    this.currentAction = 0;

    this.setupEventListeners();
    this.updateStats();
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      if (!this.aiEnabled) {
        if (e.key === "ArrowLeft") {
          this.currentAction = -1;
        } else if (e.key === "ArrowRight") {
          this.currentAction = 1;
        } else if (e.key === " ") {
          this.currentAction = 2;
        } else if (e.key === "Enter") {
          this.currentAction = 3;
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      if (
        !this.aiEnabled &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        this.currentAction = 0;
      }
    });

    document.getElementById("start-button").addEventListener("click", () => {
      this.startGame();
    });

    document.getElementById("restart-button").addEventListener("click", () => {
      this.resetGame();
      showScreen("start-screen");
    });

    document.getElementById("toggle-ai").addEventListener("click", () => {
      this.toggleAI();
    });
  }

  toggleAI() {
    this.aiEnabled = !this.aiEnabled;
    const button = document.getElementById("toggle-ai");
    const status = document.getElementById("ai-status");

    button.textContent = this.aiEnabled ? "Выключить ИИ" : "Включить ИИ";
    button.classList.toggle("active", this.aiEnabled);
    status.textContent = this.aiEnabled ? "Включен" : "Выключен";
    status.classList.toggle("active", this.aiEnabled);

    if (this.aiEnabled) {
      this.connectToAI();
    } else if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  connectToAI() {
    this.ws = new WebSocket("ws://localhost:8000/ws");

    this.ws.onopen = () => {
      console.log("Connected to AI server");
    };

    this.ws.onclose = () => {
      console.log("Disconnected from AI server");
      if (this.aiEnabled) {
        this.toggleAI();
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (this.aiEnabled) {
        this.toggleAI();
      }
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "action") {
        this.currentAction = message.data.move;
      }
    };
  }

  startGame() {
    this.gameStarted = true;
    showScreen("game-screen");
    if (this.aiEnabled && !this.ws) {
      this.connectToAI();
    }
    requestAnimationFrame(() => this.gameLoop());
  }

  resetGame() {
    this.engine.reset();
    this.currentAction = 0;
    this.gameStarted = false;
    this.updateStats();
  }

  updateStats() {
    const state = this.engine.getState();
    document.getElementById("score").textContent = state.score;
    document.getElementById("lives").textContent = state.lives;
    document.getElementById("final-score").textContent = state.score;
  }

  gameLoop() {
    if (!this.gameStarted) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Накапливаем время
    this.accumulatedTime += deltaTime;

    // Ограничиваем накопленное время
    if (this.accumulatedTime > 200) {
      this.accumulatedTime = 200;
    }

    // Обновляем физику с фиксированным шагом
    while (this.accumulatedTime >= this.engine.TIMESTEP) {
      const result = this.engine.update(
        this.engine.TIMESTEP,
        this.currentAction
      );
      this.accumulatedTime -= this.engine.TIMESTEP;

      // Отправляем состояние AI
      if (this.aiEnabled && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "state",
            data: result.state,
          })
        );
      }

      // Проверяем условия окончания игры
      if (result.state.gameOver || result.state.victory) {
        if (this.aiEnabled) {
          this.resetGame();
          this.startGame();
        } else {
          showScreen("game-over-screen");
          return;
        }
      }
    }

    // Отрисовываем текущее состояние
    this.renderer.render(this.engine.getState());
    this.updateStats();

    requestAnimationFrame(() => this.gameLoop());
  }
}

// Инициализация игры
window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  showScreen("start-screen");
});
