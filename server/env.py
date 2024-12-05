import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Dict, Tuple, Any
from game_engine import GameEngine

class ArkanoidEnv(gym.Env):
    def __init__(self):
        super().__init__()
        
        # Определение пространства действий:
        # -1: движение влево
        # 0: нет движения
        # 1: движение вправо
        # 2: прыжок
        # 3: запуск мяча
        self.action_space = spaces.Discrete(5)
        
        # Определение пространства состояний
        total_blocks = 12 * 24  # 288 блоков
        self.observation_space = spaces.Box(
            low=-1,
            high=1,
            shape=(9 + total_blocks,),
            dtype=np.float32
        )
        
        # Создаем движок
        self.engine = GameEngine()
        self.is_training = False
        
    def reset(self, seed=None) -> Tuple[np.ndarray, Dict[str, Any]]:
        super().reset(seed=seed)
        self.engine.reset()
        return self.engine.get_observation(), {}
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        if not self.is_training:
            return self.engine.get_observation(), 0.0, False, False, {}
            
        # В режиме тренировки используем фиксированный временной шаг
        result = self.engine.update(self.engine.TIMESTEP, action)
        
        # Получаем наблюдение и награду
        observation = self.engine.get_observation()
        reward = result['reward']
        
        # Проверяем завершение эпизода
        done = result['state']['gameOver'] or result['state']['victory']
        
        return observation, reward, done, False, {}
    
    def update_state(self, game_state: Dict) -> np.ndarray:
        """Обновляет состояние среды на основе данных из игры"""
        self.is_training = False  # отключаем симуляцию при реальной игре
        
        # Обновляем состояние движка
        self.engine.state['paddle']['x'] = game_state['paddle']['x']
        self.engine.state['paddle']['y'] = game_state['paddle']['y']
        self.engine.state['paddle']['vx'] = game_state['paddle']['vx']
        self.engine.state['paddle']['vy'] = game_state['paddle']['vy']
        
        self.engine.state['ball']['x'] = game_state['ball']['x']
        self.engine.state['ball']['y'] = game_state['ball']['y']
        self.engine.state['ball']['dx'] = game_state['ball']['dx']
        self.engine.state['ball']['dy'] = game_state['ball']['dy']
        self.engine.state['ball']['isLaunched'] = game_state['ball']['isLaunched']
        
        for i, block in enumerate(game_state['blocks']):
            self.engine.state['blocks'][i]['active'] = bool(block['active'])
            
        return self.engine.get_observation()
    
    def calculate_reward(self, game_state: Dict) -> float:
        """Вычисляет награду на основе текущего состояния игры"""
        return self.engine.calculate_reward()