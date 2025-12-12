import http.server
import socketserver
import json
import urllib.parse
from datetime import datetime
from database import db
from auth import Auth

# Инициализация аутентификации
auth = Auth(db)

class APIHandler(http.server.BaseHTTPRequestHandler):
    """Обработчик HTTP запросов для API"""
    
    def _set_headers(self, status_code=200, content_type='application/json'):
        """Установка заголовков ответа"""
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_OPTIONS(self):
        """Обработка CORS preflight запросов"""
        self._set_headers(200)
    
    def _get_token(self):
        """Получение токена из заголовков"""
        auth_header = self.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header[7:]
        return None
    
    def _authenticate(self):
        """Аутентификация пользователя"""
        token = self._get_token()
        if not token:
            return None, "Токен отсутствует"
        
        token_data, error = auth.verify_token(token)
        if error:
            return None, error
        
        return token_data, None
    
    def _parse_body(self):
        """Парсинг тела запроса"""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        
        body = self.rfile.read(content_length)
        try:
            return json.loads(body.decode('utf-8'))
        except:
            return {}
    
    def _send_json(self, data, status_code=200):
        """Отправка JSON ответа"""
        self._set_headers(status_code)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def _send_error(self, message, status_code=400):
        """Отправка ошибки"""
        self._send_json({'error': message}, status_code)
    
    def do_GET(self):
        """Обработка GET запросов"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        try:
            # Публичные маршруты
            if path == '/':
                self._send_json({
                    'message': 'API системы "Страховочка"',
                    'version': '1.0',
                    'endpoints': ['/api/login', '/api/register', '/api/insurance-types']
                })
                return
            
            elif path == '/api/insurance-types':
                types = db.get_insurance_types()
                self._send_json({'insurance_types': types})
                return
            
            elif path == '/api/managers':
                managers = db.get_managers()
                self._send_json({'managers': managers})
                return
            
            # Защищенные маршруты
            token_data, error = self._authenticate()
            if error:
                self._send_error(error, 401)
                return
            
            if path == '/api/me':
                user = db.get_user_by_id(token_data['user_id'])
                self._send_json({'user': user})
            
            elif path == '/api/users':
                if token_data['role'] not in ['admin', 'manager']:
                    self._send_error('Недостаточно прав', 403)
                    return
                users = db.get_all_users()
                self._send_json({'users': users})
            
            elif path == '/api/applications':
                applications = db.get_applications(
                    token_data['user_id'], 
                    token_data['role']
                )
                self._send_json({'applications': applications})
            
            else:
                self._send_error('Маршрут не найден', 404)
                
        except Exception as e:
            print(f"Ошибка обработки GET {path}: {e}")
            self._send_error('Внутренняя ошибка сервера', 500)
    
    def do_POST(self):
        """Обработка POST запросов"""
        path = urllib.parse.urlparse(self.path).path
        
        try:
            data = self._parse_body()
            
            if path == '/api/login':
                if not data.get('username') or not data.get('password'):
                    self._send_error('Необходимы логин и пароль', 400)
                    return
                
                result, error = auth.login(data['username'], data['password'])
                if error:
                    self._send_error(error, 401)
                else:
                    self._send_json(result, 200)
            
            elif path == '/api/register':
                required = ['username', 'password', 'full_name', 'email', 'role']
                for field in required:
                    if not data.get(field):
                        self._send_error(f'Поле {field} обязательно', 400)
                        return
                
                result, error = auth.register(data)
                if error:
                    self._send_error(error, 400)
                else:
                    self._send_json(result, 201)
            
            elif path == '/api/applications':
                token_data, error = self._authenticate()
                if error:
                    self._send_error(error, 401)
                    return
                
                required = ['insurance_type_id', 'insurance_subtype', 'details']
                for field in required:
                    if not data.get(field):
                        self._send_error(f'Поле {field} обязательно', 400)
                        return
                
                data['client_id'] = token_data['user_id']
                result = db.create_application(data)
                
                if result:
                    self._send_json({
                        'message': 'Заявка создана',
                        'application_id': result['id']
                    }, 201)
                else:
                    self._send_error('Ошибка создания заявки', 500)
            
            elif path == '/api/logout':
                token = self._get_token()
                if token:
                    auth.logout(token)
                self._send_json({'message': 'Выход выполнен'})
            
            else:
                self._send_error('Маршрут не найден', 404)
                
        except Exception as e:
            print(f"Ошибка обработки POST {path}: {e}")
            self._send_error('Внутренняя ошибка сервера', 500)
    
    def do_PUT(self):
        """Обработка PUT запросов"""
        path = urllib.parse.urlparse(self.path).path
        
        try:
            token_data, error = self._authenticate()
            if error:
                self._send_error(error, 401)
                return
            
            data = self._parse_body()
            
            if path.startswith('/api/applications/') and '/status' in path:
                # Обновление статуса заявки
                if token_data['role'] not in ['admin', 'manager']:
                    self._send_error('Недостаточно прав', 403)
                    return
                
                app_id = int(path.split('/')[3])
                new_status = data.get('status')
                
                if new_status not in ['В процессе', 'Обработана', 'Отклонена']:
                    self._send_error('Неверный статус', 400)
                    return
                
                result = db.update_application_status(
                    app_id, 
                    new_status, 
                    token_data['user_id']
                )
                
                if result:
                    self._send_json({'message': 'Статус обновлен'})
                else:
                    self._send_error('Заявка не найдена', 404)
            
            elif path.startswith('/api/users/'):
                # Обновление пользователя
                user_id = int(path.split('/')[-1])
                
                # Проверка прав
                if token_data['role'] != 'admin' and token_data['user_id'] != user_id:
                    self._send_error('Недостаточно прав', 403)
                    return
                
                # Обновляем только разрешенные поля
                update_fields = []
                params = []
                
                allowed_fields = ['full_name', 'age', 'phone', 'email', 'address', 'passport_data']
                
                for field in allowed_fields:
                    if field in data:
                        update_fields.append(f'{field} = ?')
                        params.append(data[field])
                
                if token_data['role'] == 'admin':
                    if 'role' in data:
                        update_fields.append('role = ?')
                        params.append(data['role'])
                    if 'manager_id' in data:
                        update_fields.append('manager_id = ?')
                        params.append(data['manager_id'])
                
                if not update_fields:
                    self._send_error('Нет данных для обновления', 400)
                    return
                
                params.append(user_id)
                query = f'UPDATE users SET {", ".join(update_fields)} WHERE id = ?'
                
                db.execute_query(query, tuple(params))
                self._send_json({'message': 'Данные обновлены'})
            
            else:
                self._send_error('Маршрут не найден', 404)
                
        except Exception as e:
            print(f"Ошибка обработки PUT {path}: {e}")
            self._send_error('Внутренняя ошибка сервера', 500)
    
    def do_DELETE(self):
        """Обработка DELETE запросов"""
        path = urllib.parse.urlparse(self.path).path
        
        try:
            token_data, error = self._authenticate()
            if error:
                self._send_error(error, 401)
                return
            
            if path.startswith('/api/users/'):
                if token_data['role'] != 'admin':
                    self._send_error('Недостаточно прав', 403)
                    return
                
                user_id = int(path.split('/')[-1])
                
                # Нельзя удалить самого себя
                if token_data['user_id'] == user_id:
                    self._send_error('Нельзя удалить самого себя', 400)
                    return
                
                result = db.delete_user(user_id)
                if result:
                    self._send_json({'message': 'Пользователь удален'})
                else:
                    self._send_error('Ошибка удаления', 500)
            
            else:
                self._send_error('Маршрут не найден', 404)
                
        except Exception as e:
            print(f"Ошибка обработки DELETE {path}: {e}")
            self._send_error('Внутренняя ошибка сервера', 500)
    
    def log_message(self, format, *args):
        """Отключаем логирование в консоль для чистоты"""
        pass

def run_server(port=5000):
    """Запуск HTTP сервера"""
    handler = APIHandler
    httpd = socketserver.TCPServer(("", port), handler)
    
    print("=" * 50)
    print(f"🚀 Сервер 'Страховочка' запущен!")
    print(f"📡 Адрес: http://localhost:{port}")
    print("=" * 50)
    print("\n📊 Тестовые пользователи:")
    print("   Администратор: логин 'admin', пароль 'password123'")
    print("   Менеджер:      логин 'manager1', пароль 'password123'")
    print("   Клиент:        логин 'client1', пароль 'password123'")
    print("\n⚡ Для остановки сервера нажмите Ctrl+C")
    print("=" * 50)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Сервер остановлен")
    finally:
        db.close()
        httpd.server_close()

if __name__ == "__main__":
    run_server(5000)

# python server.py