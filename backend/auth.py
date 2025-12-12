import hashlib
import time
import json

class Auth:
    def __init__(self, db):
        self.db = db
        self.tokens = {}  # Простое хранилище токенов
    
    def login(self, username, password):
        """Авторизация пользователя"""
        user = self.db.verify_user(username, password)
        
        if not user:
            return None, "Неверный логин или пароль"
        
        # Создаем токен
        token = hashlib.sha256(
            f"{user['id']}{user['username']}{time.time()}".encode()
        ).hexdigest()
        
        # Сохраняем токен
        self.tokens[token] = {
            'user_id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'expires': time.time() + 86400  # 24 часа
        }
        
        return {
            'token': token,
            'user': user
        }, None
    
    def verify_token(self, token):
        """Проверка токена"""
        if token not in self.tokens:
            return None, "Неверный токен"
        
        token_data = self.tokens[token]
        
        # Проверяем срок действия
        if time.time() > token_data['expires']:
            del self.tokens[token]
            return None, "Токен истек"
        
        return token_data, None
    
    def logout(self, token):
        """Выход из системы"""
        if token in self.tokens:
            del self.tokens[token]
        return True
    
    def register(self, user_data):
        """Регистрация нового пользователя"""
        # Проверяем, существует ли пользователь
        existing = self.db.get_user_by_username(user_data['username'])
        if existing:
            return None, "Пользователь с таким логином уже существует"
        
        # Создаем пользователя
        result = self.db.create_user(user_data)
        
        if result:
            # Автоматически логиним после регистрации
            return self.login(user_data['username'], user_data['password'])
        else:
            return None, "Ошибка при создании пользователя"

# Глобальный экземпляр аутентификации
auth = None