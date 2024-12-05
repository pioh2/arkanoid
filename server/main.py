from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import json
import numpy as np
from typing import Dict, List
import asyncio
from agent import ArkanoidAgent
from env import ArkanoidEnv
import threading
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация агента и среды
agent = ArkanoidAgent()
env = ArkanoidEnv()

# Статистика обучения
total_episodes = 0
total_rewards = 0
episode_rewards = 0
best_reward = float('-inf')
last_reward = 0
last_action = None

def log_training_stats():
    if total_episodes > 0:
        avg_reward = total_rewards / total_episodes
        logging.info(f"Episodes: {total_episodes}, Avg Reward: {avg_reward:.2f}, Best Reward: {best_reward:.2f}, Current Episode Reward: {episode_rewards:.2f}")

# Запуск обучения в отдельном потоке
def train_agent():
    logging.info("Starting agent training...")
    env.is_training = True  # Включаем режим симуляции
    try:
        agent.train()
    except Exception as e:
        logging.error(f"Error in training: {e}")
        import traceback
        logging.error(traceback.format_exc())
    finally:
        env.is_training = False  # Выключаем режим симуляции

training_thread = threading.Thread(target=train_agent, daemon=True)
training_thread.start()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global total_episodes, total_rewards, episode_rewards, best_reward, last_reward, last_action
    
    await websocket.accept()
    logging.info("New client connected")
    env.is_training = False  # Выключаем симуляцию при подключении клиента
    
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "state":
                # Обновляем состояние среды
                state = env.update_state(data["data"])
                
                # Получаем действие от модели
                action = agent.get_action(state)
                
                # Вычисляем награду
                reward = env.calculate_reward(data["data"])
                episode_rewards += reward
                
                # Проверяем окончание эпизода
                if data["data"].get("ball_missed", False) or data["data"].get("game_over", False) or data["data"].get("victory", False):
                    total_episodes += 1
                    total_rewards += episode_rewards
                    best_reward = max(best_reward, episode_rewards)
                    log_training_stats()
                    episode_rewards = 0
                
                # Отправляем действие обратно в игру
                response = {
                    "type": "action",
                    "data": {
                        "move": action,
                        "reward": reward
                    }
                }
                await websocket.send_json(response)
                
                # Логируем только при изменении действия или награды
                if action != last_action or reward != last_reward:
                    if reward != 0:  # Добавляем награду в лог только если она не нулевая
                        logging.info(f"Action: {action}, Reward: {reward:.2f}")
                    else:
                        logging.info(f"Action: {action}")
                    last_action = action
                    last_reward = reward
                
    except Exception as e:
        logging.error(f"Error in websocket handler: {e}")
        import traceback
        logging.error(traceback.format_exc())
    finally:
        logging.info("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 