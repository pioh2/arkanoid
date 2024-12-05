from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import BaseCallback
from stable_baselines3.common.torch_layers import BaseFeaturesExtractor
import os
import redis
from env import ArkanoidEnv
import torch
import torch.nn as nn
import numpy as np
from gymnasium import spaces

class ArkanoidCNN(BaseFeaturesExtractor):
    def __init__(self, observation_space: spaces.Box, features_dim: int = 512):
        super().__init__(observation_space, features_dim)
        
        # Преобразуем входные данные в удобный формат
        # Первые 8 значений - это состояние платформы и мяча
        # Остальные 288 значений - это состояние блоков (12x24)
        self.paddle_ball_net = nn.Sequential(
            nn.Linear(9, 64),  # 8 + 1 (флаг запуска)
            nn.ReLU(),
            nn.Linear(64, 128),
            nn.ReLU()
        )
        
        # Сеть для обработки блоков
        self.blocks_net = nn.Sequential(
            nn.Linear(288, 256),  # Сначала преобразуем в вектор
            nn.ReLU(),
            nn.Linear(256, 256),
            nn.ReLU(),
            nn.Linear(256, 384),
            nn.ReLU()
        )
        
        # Объединяющая сеть
        self.combine_net = nn.Sequential(
            nn.Linear(512, features_dim),  # 128 + 384 = 512
            nn.ReLU()
        )

    def forward(self, observations: torch.Tensor) -> torch.Tensor:
        # Разделяем входные данные
        paddle_ball_state = observations[:, :9]  # Первые 9 значений (включая флаг запуска)
        blocks_state = observations[:, 9:]  # Оставшиеся значения
        
        # Обрабатываем каждую часть
        paddle_ball_features = self.paddle_ball_net(paddle_ball_state)
        blocks_features = self.blocks_net(blocks_state)
        
        # Объединяем признаки
        combined = torch.cat([paddle_ball_features, blocks_features], dim=1)
        return self.combine_net(combined)

class SaveBestModelCallback(BaseCallback):
    def __init__(self, check_freq: int, redis_client: redis.Redis, verbose=1):
        super().__init__(verbose)
        self.check_freq = check_freq
        self.redis_client = redis_client
        self.best_mean_reward = -np.inf
        
    def _on_step(self) -> bool:
        if self.n_calls % self.check_freq == 0:
            # Получаем среднюю награду
            x = self.model.ep_info_buffer
            if len(x) > 0:
                mean_reward = np.mean([ep['r'] for ep in x])
                
                # Если награда лучше предыдущей, сохраняем модель
                if mean_reward > self.best_mean_reward:
                    self.best_mean_reward = mean_reward
                    
                    # Сохраняем модель во временый файл
                    temp_path = "temp_model.zip"
                    self.model.save(temp_path)
                    
                    # Читаем файл и сохраняем в Redis
                    with open(temp_path, "rb") as f:
                        model_data = f.read()
                        self.redis_client.set("best_model", model_data)
                    
                    # Удаляем временный файл
                    os.remove(temp_path)
                    
                    if self.verbose > 0:
                        print(f"Saving new best model with mean reward: {mean_reward:.2f}")
        return True

class ArkanoidAgent:
    def __init__(self, redis_host="localhost", redis_port=6379):
        self.env = ArkanoidEnv()
        self.redis_client = redis.Redis(host=redis_host, port=redis_port)
        self.last_action = None
        
        # Определяем устройство для обучения
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")
        
        # Создаем пользовательскую политику
        policy_kwargs = {
            "features_extractor_class": ArkanoidCNN,
            "features_extractor_kwargs": {"features_dim": 512},
            "net_arch": {
                "pi": [256, 128],
                "vf": [256, 128]
            }
        }
        
        # Проверяем, есть ли сохраненная модель в Redis
        model_data = self.redis_client.get("best_model")
        if model_data:
            # Если есть, загружаем её
            with open("temp_model.zip", "wb") as f:
                f.write(model_data)
            self.model = PPO.load("temp_model.zip", env=self.env, device=self.device)
            os.remove("temp_model.zip")
        else:
            # Если нет, создаем новую модель
            self.model = PPO(
                "MlpPolicy",
                self.env,
                verbose=1,
                learning_rate=1e-4,
                n_steps=2048,
                batch_size=64,
                n_epochs=10,
                gamma=0.99,
                gae_lambda=0.95,
                clip_range=0.2,
                policy_kwargs=policy_kwargs,
                device=self.device
            )
    
    def get_action(self, state: np.ndarray) -> int:
        """Получает действие от модели для текущего состояния"""
        # Убеждаемся, что состояние имеет правильную форму (batch_size, features)
        if len(state.shape) == 1:
            state = state.reshape(1, -1)
        action, _ = self.model.predict(state, deterministic=True)
        return int(action[0]) if isinstance(action, np.ndarray) else int(action)
    
    def train(self, total_timesteps: int = 1000000):
        """Запускает процесс обучения модели"""
        callback = SaveBestModelCallback(check_freq=1000, redis_client=self.redis_client)
        self.model.learn(
            total_timesteps=total_timesteps,
            callback=callback,
            progress_bar=True
        ) 