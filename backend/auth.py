import hashlib
import time
import json


class Auth:
    def __init__(self, db):
        self.db = db
        self.tokens = {}

    def login(self, username, password):
        user = self.db.verify_user(username, password)

        if not user:
            return None, "Неверный логин или пароль"

        token = hashlib.sha256(
            f"{user['id']}{user['username']}{time.time()}".encode()
        ).hexdigest()

        self.tokens[token] = {
            "user_id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "expires": time.time() + 86400,
        }

        return {"token": token, "user": user}, None

    def verify_token(self, token):
        if token not in self.tokens:
            return None, "Неверный токен"

        token_data = self.tokens[token]

        if time.time() > token_data["expires"]:
            del self.tokens[token]
            return None, "Токен истек"

        return token_data, None

    def logout(self, token):
        if token in self.tokens:
            del self.tokens[token]
        return True

    def register(self, user_data):
        existing = self.db.get_user_by_username(user_data["username"])
        if existing:
            return None, "Пользователь с таким логином уже существует"

        result = self.db.create_user(user_data)

        if result:
            return self.login(user_data["username"], user_data["password"])
        else:
            return None, "Ошибка при создании пользователя"


auth = None
