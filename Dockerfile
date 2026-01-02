# Используем официальный образ Python
FROM python:3.10-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости
COPY backend/requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY backend/ .
COPY frontend/ /app/frontend/

# Создаем папку для базы данных
RUN mkdir -p /data && chmod 777 /data

# Создаем не-root пользователя для безопасности
RUN useradd -m -u 1000 strahovochka && \
    chown -R strahovochka:strahovochka /app /data

USER strahovochka

# Инициализируем базу данных
RUN python -c "
import sqlite3
import hashlib

conn = sqlite3.connect('/data/strahovochka.db')
cursor = conn.cursor()

# Таблица пользователей
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL
    )
''')

# Таблица заявок
cursor.execute('''
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        insurance_type TEXT NOT NULL,
        status TEXT DEFAULT 'В процессе',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')

# Тестовые данные
hashed = hashlib.sha256(('password123' + 'salt').encode()).hexdigest()
cursor.execute('''
    INSERT OR IGNORE INTO users 
    (username, password, role, full_name, email)
    VALUES 
    ('admin', ?, 'admin', 'Администратор', 'admin@test.ru'),
    ('manager1', ?, 'manager', 'Менеджер', 'manager@test.ru'),
    ('client1', ?, 'client', 'Клиент', 'client@test.ru')
''', (hashed, hashed, hashed))

conn.commit()
conn.close()
print('Database initialized')
"

# Открываем порт
EXPOSE 5000

# Команда запуска
CMD ["python", "server.py"]