import numpy as np
import time

class GameEngine:
    def __init__(self):
        # Состояние игры
        self.state = {
            'paddle': {
                'x': 0.5,
                'y': 0.9,
                'vx': 0,
                'vy': 0,
                'width': 0.2,
                'height': 0.02
            },
            'ball': {
                'x': 0.5,
                'y': 0.85,
                'dx': 0,
                'dy': 0,
                'radius': 0.01,
                'speed': 0.4,
                'isLaunched': False
            },
            'blocks': [],
            'score': 0,
            'lives': 3,
            'gameOver': False,
            'victory': False
        }

        # Константы
        self.TIMESTEP = 1  # 1ms фиксированный шаг
        self.PADDLE_SPEED = 0.5
        self.PADDLE_JUMP_SPEED = 0.3
        self.GRAVITY = 0.001

        # Инициализация блоков
        self.init_blocks()
        self.last_step_time = time.time() * 1000

    def init_blocks(self):
        self.state['blocks'] = []
        for row in range(12):
            for col in range(24):
                self.state['blocks'].append({
                    'x': col / 24,
                    'y': row / 12,
                    'width': 1 / 24,
                    'height': 1 / 12,
                    'active': True
                })

    def reset(self):
        self.state['paddle']['x'] = 0.5
        self.state['paddle']['y'] = 0.9
        self.state['paddle']['vx'] = 0
        self.state['paddle']['vy'] = 0
        self.state['ball']['x'] = self.state['paddle']['x']
        self.state['ball']['y'] = self.state['paddle']['y'] - 0.05
        self.state['ball']['dx'] = 0
        self.state['ball']['dy'] = 0
        self.state['ball']['isLaunched'] = False
        self.state['score'] = 0
        self.state['lives'] = 3
        self.state['gameOver'] = False
        self.state['victory'] = False
        self.init_blocks()

    def update(self, dt, action=None):
        # Обработка действий
        if action is not None:
            self.handle_action(action)

        # Обновление физики
        self.update_physics(dt)

        # Проверка коллизий
        self.check_collisions()

        # Проверка условий окончания игры
        self.check_game_conditions()

        return {
            'state': self.get_state(),
            'reward': self.calculate_reward()
        }

    def handle_action(self, action):
        if action == -1:  # влево
            self.state['paddle']['vx'] = -self.PADDLE_SPEED
        elif action == 1:  # вправо
            self.state['paddle']['vx'] = self.PADDLE_SPEED
        elif action == 0:  # стоп
            self.state['paddle']['vx'] = 0
        elif action == 2:  # прыжок
            if self.state['paddle']['y'] >= 0.9:
                self.state['paddle']['vy'] = -self.PADDLE_JUMP_SPEED
        elif action == 3:  # запуск мяча
            if not self.state['ball']['isLaunched']:
                self.state['ball']['isLaunched'] = True
                self.state['ball']['dx'] = 0.2
                self.state['ball']['dy'] = -self.state['ball']['speed']

    def update_physics(self, dt):
        dt_seconds = dt / 1000

        # Обновление платформы
        self.state['paddle']['x'] += self.state['paddle']['vx'] * dt_seconds
        self.state['paddle']['y'] += self.state['paddle']['vy'] * dt_seconds
        self.state['paddle']['vy'] += self.GRAVITY * dt_seconds

        # Ограничения для платформы
        self.state['paddle']['x'] = max(
            self.state['paddle']['width']/2,
            min(1 - self.state['paddle']['width']/2, self.state['paddle']['x'])
        )
        self.state['paddle']['y'] = min(max(0, self.state['paddle']['y']), 0.9)
        if self.state['paddle']['y'] >= 0.9:
            self.state['paddle']['vy'] = 0

        # Обновление мяча
        if self.state['ball']['isLaunched']:
            self.state['ball']['x'] += self.state['ball']['dx'] * dt_seconds
            self.state['ball']['y'] += self.state['ball']['dy'] * dt_seconds
        else:
            self.state['ball']['x'] = self.state['paddle']['x']
            self.state['ball']['y'] = self.state['paddle']['y'] - 0.05

    def check_collisions(self):
        # Коллизии мяча со стенами
        if (self.state['ball']['x'] <= self.state['ball']['radius'] or 
            self.state['ball']['x'] >= 1 - self.state['ball']['radius']):
            self.state['ball']['dx'] *= -1
        if self.state['ball']['y'] <= self.state['ball']['radius']:
            self.state['ball']['dy'] *= -1

        # Коллизия с платформой
        if (self.state['ball']['y'] >= self.state['paddle']['y'] - self.state['ball']['radius'] and
            self.state['ball']['y'] <= self.state['paddle']['y'] + self.state['paddle']['height'] and
            abs(self.state['ball']['x'] - self.state['paddle']['x']) < self.state['paddle']['width']/2):
            self.state['ball']['dy'] = -self.state['ball']['speed']
            # Изменение угла отскока в зависимости от места удара
            hit_point = ((self.state['ball']['x'] - 
                       (self.state['paddle']['x'] - self.state['paddle']['width']/2)) / 
                       self.state['paddle']['width'])
            self.state['ball']['dx'] = (hit_point - 0.5) * self.state['ball']['speed'] * 2

        # Коллизии с блоками
        for block in self.state['blocks']:
            if not block['active']:
                continue

            if (self.state['ball']['y'] >= block['y'] and
                self.state['ball']['y'] <= block['y'] + block['height'] and
                self.state['ball']['x'] >= block['x'] and
                self.state['ball']['x'] <= block['x'] + block['width']):
                block['active'] = False
                self.state['score'] += 100
                self.state['ball']['dy'] *= -1

    def check_game_conditions(self):
        # Проверка пропуска мяча
        if self.state['ball']['y'] > 1:
            self.state['lives'] -= 1
            if self.state['lives'] <= 0:
                self.state['gameOver'] = True
            else:
                self.reset_ball()

        # Проверка победы
        if all(not block['active'] for block in self.state['blocks']):
            self.state['victory'] = True

    def reset_ball(self):
        self.state['ball']['isLaunched'] = False
        self.state['ball']['x'] = self.state['paddle']['x']
        self.state['ball']['y'] = self.state['paddle']['y'] - 0.05
        self.state['ball']['dx'] = 0
        self.state['ball']['dy'] = 0

    def calculate_reward(self):
        reward = 0

        # Штраф за пропуск мяча
        if self.state['ball']['y'] > 1:
            reward -= 5.0

        # Награда за отбивание мяча
        if (self.state['ball']['dy'] < 0 and
            abs(self.state['ball']['y'] - self.state['paddle']['y']) < 0.02):
            reward += 0.5

        # Награда за уничтожение блока (добавляется в check_collisions)
        # reward += 1.0 за каждый уничтоженный блок

        # Награда/штраф за окончание игры
        if self.state['victory']:
            reward += 10.0
        if self.state['gameOver']:
            reward -= 10.0

        # Штраф за неактивность
        if not self.state['ball']['isLaunched']:
            reward -= 0.01

        return reward

    def get_state(self):
        return {
            'paddle': self.state['paddle'].copy(),
            'ball': self.state['ball'].copy(),
            'blocks': [block.copy() for block in self.state['blocks']],
            'score': self.state['score'],
            'lives': self.state['lives'],
            'gameOver': self.state['gameOver'],
            'victory': self.state['victory']
        }

    def get_observation(self):
        """Возвращает наблюдение в формате для RL агента"""
        obs = np.zeros(297)  # 8 для состояния + 1 для флага запуска + 288 для блоков
        
        # Состояние платформы и мяча
        obs[0] = self.state['paddle']['x']
        obs[1] = self.state['paddle']['y']
        obs[2] = self.state['paddle']['vx']
        obs[3] = self.state['paddle']['vy']
        obs[4] = self.state['ball']['x']
        obs[5] = self.state['ball']['y']
        obs[6] = self.state['ball']['dx']
        obs[7] = self.state['ball']['dy']
        obs[8] = float(self.state['ball']['isLaunched'])
        
        # Состояние блоков
        for i, block in enumerate(self.state['blocks']):
            obs[9 + i] = float(block['active'])
            
        return obs 