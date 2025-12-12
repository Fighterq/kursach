import sqlite3
import json
import hashlib  # Используем стандартную библиотеку
from datetime import datetime
import hmac
import base64

class Database:
    def __init__(self, db_path='strahovochka.db'):
        self.db_path = db_path
        self.conn = None
        self.connect()
        self.init_db()
    
    def connect(self):
        """Подключение к базе данных SQLite"""
        try:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
            print("✅ Подключение к SQLite успешно!")
        except Exception as e:
            print(f"❌ Ошибка подключения: {e}")
    
    def _hash_password(self, password):
        """Хеширование пароля с использованием SHA256"""
        salt = "strahovochka_salt_2024"
        return hashlib.sha256((password + salt).encode()).hexdigest()
    
    def _check_password(self, password, hashed):
        """Проверка пароля"""
        return self._hash_password(password) == hashed
    
    def init_db(self):
        """Инициализация базы данных и создание таблиц"""
        try:
            cursor = self.conn.cursor()
            
            # Таблица пользователей
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'client')),
                    full_name TEXT NOT NULL,
                    age INTEGER,
                    phone TEXT,
                    email TEXT UNIQUE NOT NULL,
                    address TEXT,
                    passport_data TEXT,
                    manager_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Таблица типов страховки
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS insurance_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    options TEXT,
                    base_price REAL NOT NULL
                )
            ''')
            
            # Таблица заявок
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL,
                    manager_id INTEGER,
                    insurance_type_id INTEGER NOT NULL,
                    insurance_subtype TEXT,
                    details TEXT,
                    status TEXT DEFAULT 'В процессе' CHECK (status IN ('В процессе', 'Обработана', 'Отклонена')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP,
                    price REAL
                )
            ''')
            
            # Добавляем типы страховок если их нет
            self._seed_data()
            
            self.conn.commit()
            print("✅ База данных инициализирована!")
            
        except Exception as e:
            print(f"❌ Ошибка инициализации БД: {e}")
    
    def _seed_data(self):
        """Заполнение начальными данными"""
        cursor = self.conn.cursor()
        
        # Типы страховок
        insurance_types = [
            ('Дом', 'property', '{"coverage": ["пожар", "затопление", "кража"]}', 15000.00),
            ('Автомобиль - ОСАГО', 'auto', '{"type": "ОСАГО", "coverage": ["гражданская ответственность"]}', 5000.00),
            ('Автомобиль - КАСКО', 'auto', '{"type": "КАСКО", "coverage": ["ущерб", "угон", "полная гибель"]}', 30000.00)
        ]
        
        for ins_type in insurance_types:
            cursor.execute('''
                INSERT OR IGNORE INTO insurance_types (name, category, options, base_price)
                VALUES (?, ?, ?, ?)
            ''', ins_type)
        
        # Хеш пароля 'password123'
        hashed_password = self._hash_password('password123')
        
        # Тестовые пользователи
        users = [
            ('admin', hashed_password, 'admin', 'Администратор Системы', 'admin@strahovochka.ru'),
            ('manager1', hashed_password, 'manager', 'Иванов Иван Иванович', 'manager@strahovochka.ru'),
            ('client1', hashed_password, 'client', 'Петров Петр Петрович', 'client@mail.ru')
        ]
        
        for user in users:
            cursor.execute('''
                INSERT OR IGNORE INTO users (username, password, role, full_name, email)
                VALUES (?, ?, ?, ?, ?)
            ''', user)
        
        # Тестовые заявки
        cursor.execute('SELECT id FROM users WHERE username = "client1"')
        client = cursor.fetchone()
        
        cursor.execute('SELECT id FROM insurance_types WHERE name LIKE "%ОСАГО%"')
        insurance = cursor.fetchone()
        
        if client and insurance:
            cursor.execute('''
                INSERT OR IGNORE INTO applications 
                (client_id, insurance_type_id, insurance_subtype, details, status)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                client['id'], 
                insurance['id'], 
                'легковой',
                '{"model": "Toyota Camry", "year": 2020, "number": "А123БВ777"}',
                'В процессе'
            ))
    
    def execute_query(self, query, params=None, fetchone=False, fetchall=False):
        """Выполнение SQL запроса"""
        try:
            cursor = self.conn.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if fetchone:
                row = cursor.fetchone()
                result = dict(row) if row else None
            elif fetchall:
                rows = cursor.fetchall()
                result = [dict(row) for row in rows]
            else:
                result = None
                self.conn.commit()
            
            cursor.close()
            return result
            
        except Exception as e:
            print(f"❌ Ошибка SQL: {e}")
            print(f"Запрос: {query}")
            return None
    
    def get_user_by_username(self, username):
        """Получить пользователя по логину"""
        return self.execute_query(
            'SELECT * FROM users WHERE username = ?',
            (username,),
            fetchone=True
        )
    
    def get_user_by_id(self, user_id):
        """Получить пользователя по ID"""
        return self.execute_query(
            'SELECT id, username, role, full_name, email, phone, address FROM users WHERE id = ?',
            (user_id,),
            fetchone=True
        )
    
    def create_user(self, user_data):
        """Создать нового пользователя"""
        hashed_password = self._hash_password(user_data['password'])
        
        return self.execute_query('''
            INSERT INTO users (username, password, role, full_name, age, phone, email, address, passport_data, manager_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        ''', (
            user_data['username'],
            hashed_password,
            user_data['role'],
            user_data['full_name'],
            user_data.get('age'),
            user_data.get('phone'),
            user_data['email'],
            user_data.get('address'),
            user_data.get('passport_data'),
            user_data.get('manager_id')
        ), fetchone=True)
    
    def verify_user(self, username, password):
        """Проверка логина и пароля"""
        user = self.get_user_by_username(username)
        if not user:
            return None
        
        if self._check_password(password, user['password']):
            # Убираем пароль из данных пользователя
            user_dict = dict(user)
            user_dict.pop('password', None)
            return user_dict
        
        return None
    
    def get_applications(self, user_id=None, user_role=None):
        """Получить заявки с фильтрацией по роли"""
        if user_role == 'client':
            query = '''
                SELECT a.*, it.name as insurance_name, u.full_name as manager_name
                FROM applications a
                LEFT JOIN insurance_types it ON a.insurance_type_id = it.id
                LEFT JOIN users u ON a.manager_id = u.id
                WHERE a.client_id = ?
                ORDER BY a.created_at DESC
            '''
            return self.execute_query(query, (user_id,), fetchall=True)
        
        elif user_role == 'manager':
            query = '''
                SELECT a.*, it.name as insurance_name, u.full_name as client_name
                FROM applications a
                LEFT JOIN insurance_types it ON a.insurance_type_id = it.id
                LEFT JOIN users u ON a.client_id = u.id
                WHERE a.manager_id = ? OR a.manager_id IS NULL
                ORDER BY a.created_at DESC
            '''
            return self.execute_query(query, (user_id,), fetchall=True)
        
        else:  # admin
            query = '''
                SELECT a.*, it.name as insurance_name, 
                       uc.full_name as client_name, um.full_name as manager_name
                FROM applications a
                LEFT JOIN insurance_types it ON a.insurance_type_id = it.id
                LEFT JOIN users uc ON a.client_id = uc.id
                LEFT JOIN users um ON a.manager_id = um.id
                ORDER BY a.created_at DESC
            '''
            return self.execute_query(query, fetchall=True)
    
    def create_application(self, application_data):
        """Создать новую заявку"""
        return self.execute_query('''
            INSERT INTO applications (client_id, insurance_type_id, insurance_subtype, details, status)
            VALUES (?, ?, ?, ?, 'В процессе')
            RETURNING id
        ''', (
            application_data['client_id'],
            application_data['insurance_type_id'],
            application_data['insurance_subtype'],
            json.dumps(application_data['details'])
        ), fetchone=True)
    
    def update_application_status(self, app_id, status, manager_id=None):
        """Обновить статус заявки"""
        query = '''
            UPDATE applications 
            SET status = ?, processed_at = ?
        '''
        params = [status, datetime.now().isoformat()]
        
        if manager_id:
            query += ', manager_id = ?'
            params.append(manager_id)
        
        query += ' WHERE id = ? RETURNING id'
        params.append(app_id)
        
        return self.execute_query(query, tuple(params), fetchone=True)
    
    def get_all_users(self):
        """Получить всех пользователей"""
        return self.execute_query('''
            SELECT id, username, role, full_name, email, phone, address, created_at 
            FROM users 
            ORDER BY created_at DESC
        ''', fetchall=True)
    
    def get_managers(self):
        """Получить всех менеджеров"""
        return self.execute_query('''
            SELECT id, full_name, email 
            FROM users 
            WHERE role = 'manager' 
            ORDER BY full_name
        ''', fetchall=True)
    
    def get_insurance_types(self):
        """Получить все типы страховок"""
        return self.execute_query('SELECT * FROM insurance_types ORDER BY category, name', fetchall=True)
    
    def delete_user(self, user_id):
        """Удалить пользователя"""
        return self.execute_query('DELETE FROM users WHERE id = ?', (user_id,))
    
    def close(self):
        """Закрыть соединение с БД"""
        if self.conn:
            self.conn.close()

# Глобальный экземпляр базы данных
db = Database()