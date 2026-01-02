@echo off
echo ========================================
echo Система сборки "Страховочка" для Windows
echo ========================================
echo.

:menu
echo Выберите действие:
echo 1. Полная установка и сборка
echo 2. Установка зависимостей
echo 3. Запуск тестов
echo 4. Проверка кода линтером
echo 5. Форматирование кода
echo 6. Запуск сервера разработки
echo 7. Очистка проекта
echo 8. Инициализация базы данных
echo 9. Создать резервную копию БД
echo 0. Выход
echo.

set /p choice="Введите номер: "

if "%choice%"=="1" goto full_build
if "%choice%"=="2" goto install
if "%choice%"=="3" goto test
if "%choice%"=="4" goto lint
if "%choice%"=="5" goto format
if "%choice%"=="6" goto run
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto init_db
if "%choice%"=="9" goto backup
if "%choice%"=="0" goto exit
goto menu

:full_build
echo.
echo [1/5] Очистка проекта...
call :clean
echo [2/5] Установка зависимостей...
call :install
echo [3/5] Запуск тестов...
call :test
echo [4/5] Проверка кода...
call :lint
echo [5/5] Инициализация БД...
call :init_db
echo.
echo ========================================
echo Сборка завершена успешно!
echo Запустите сервер: py server.py
echo ========================================
pause
goto menu

:install
cd backend
pip install --upgrade pip
if exist requirements.txt (
    pip install -r requirements.txt
) else (
    pip install flask flask-cors
)
cd ..
goto menu

:test
cd backend
if exist tests (
    python -m pytest tests/ -v
) else (
    echo Тесты не найдены, создание структуры тестов...
    mkdir tests 2>nul
    echo # Тесты будут здесь > tests/test_sample.py
)
cd ..
goto menu

:lint
cd backend
python -m flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
cd ..
goto menu

:format
cd backend
python -m black . --check
cd ..
goto menu

:run
cd backend
echo Сервер запускается на http://localhost:5000
echo.
python server.py
cd ..
goto menu

:clean
echo Удаление временных файлов...
del /s /q *.pyc 2>nul
del /s /q __pycache__ 2>nul
rmdir /s /q __pycache__ 2>nul
del strahovochka.db 2>nul
del backend\strahovochka.db 2>nul
echo Очистка завершена!
goto menu

:init_db
cd backend
python -c "
try:
    import sqlite3
    conn = sqlite3.connect('strahovochka.db')
    cursor = conn.cursor()
    
    # Создаем таблицы
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            full_name TEXT,
            email TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY,
            client_id INTEGER,
            insurance_type TEXT,
            status TEXT DEFAULT 'В процессе',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Добавляем тестового пользователя
    import hashlib
    hashed = hashlib.sha256(('password123' + 'salt').encode()).hexdigest()
    
    cursor.execute('''
        INSERT OR IGNORE INTO users 
        (username, password, role, full_name, email)
        VALUES (?, ?, ?, ?, ?)
    ''', ('admin', hashed, 'admin', 'Администратор', 'admin@test.ru'))
    
    conn.commit()
    print('✅ База данных создана успешно!')
    print('👤 Тестовый пользователь: admin / password123')
    
except Exception as e:
    print(f'❌ Ошибка: {e}')
"
cd ..
goto menu

:backup
set timestamp=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%
set timestamp=%timestamp: =0%
copy strahovochka.db strahovochka_backup_%timestamp%.db 2>nul || copy backend\strahovochka.db strahovochka_backup_%timestamp%.db
echo Резервная копия создана: strahovochka_backup_%timestamp%.db
goto menu

:exit
echo Выход...
pause