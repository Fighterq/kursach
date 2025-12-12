// Конфигурация
const API_URL = 'http://localhost:5000';
let currentUser = null;
let currentToken = null;

// DOM элементы
let mainContent = document.getElementById('main-content');
let header = document.getElementById('header');

// Утилиты
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function getRoleName(role) {
    const roles = {
        'admin': 'Администратор',
        'manager': 'Менеджер',
        'client': 'Клиент'
    };
    return roles[role] || role;
}

function getStatusClass(status) {
    switch(status) {
        case 'В процессе': return 'status-processing';
        case 'Обработана': return 'status-processed';
        case 'Отклонена': return 'status-rejected';
        default: return '';
    }
}

// API функции
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (currentToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (response.status === 401) {
            logout();
            return null;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка сервера');
        }
        
        return data;
    } catch (error) {
        console.error('API ошибка:', error);
        showNotification(error.message, 'error');
        return null;
    }
}

// Навигация
function showPage(pageId, ...args) {
    // Обновляем навигацию
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Загружаем страницу
    switch(pageId) {
        case 'home':
            loadHomePage();
            break;
        case 'login':
            loadLoginPage();
            break;
        case 'register':
            loadRegisterPage();
            break;
        case 'dashboard':
            loadDashboardPage();
            break;
        case 'applications':
            loadApplicationsPage();
            break;
        case 'users':
            loadUsersPage();
            break;
        case 'profile':
            loadProfilePage();
            break;
        case 'new-application':
            loadNewApplicationPage();
            break;
        default:
            loadHomePage();
    }
}

// Страницы
function loadHomePage() {
    mainContent.innerHTML = `
        <section class="page active">
            <div class="hero">
                <div class="hero-content">
                    <h2>Надежная защита для вас и вашего имущества</h2>
                    <p>Комплексные страховые решения с индивидуальным подходом</p>
                    <div class="hero-buttons">
                        ${!currentUser ? `
                            <button class="btn btn-primary" onclick="showPage('register')">
                                <i class="fas fa-file-signature"></i> Оформить страховку
                            </button>
                            <button class="btn btn-outline" onclick="showPage('login')">
                                <i class="fas fa-user-check"></i> Личный кабинет
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="showPage('dashboard')">
                                <i class="fas fa-tachometer-alt"></i> Перейти в личный кабинет
                            </button>
                        `}
                    </div>
                </div>
            </div>

            <div class="features">
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-home"></i>
                    </div>
                    <h3>Страхование дома</h3>
                    <p>Защита от пожара, затопления и других непредвиденных ситуаций</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-car"></i>
                    </div>
                    <h3>Автострахование</h3>
                    <p>ОСАГО и КАСКО для полной защиты вашего автомобиля</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3>Круглосуточная поддержка</h3>
                    <p>Наши менеджеры всегда готовы помочь вам</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <h3>Быстрое оформление</h3>
                    <p>Оформите страховку онлайн всего за 15 минут</p>
                </div>
            </div>
        </section>
    `;
    
    updateHeader();
}

function loadLoginPage() {
    mainContent.innerHTML = `
        <section class="page active">
            <div class="auth-container">
                <h2><i class="fas fa-sign-in-alt"></i> Вход в систему</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="login-username"><i class="fas fa-user"></i> Логин</label>
                        <input type="text" id="login-username" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password"><i class="fas fa-lock"></i> Пароль</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="button" class="btn btn-primary btn-block" onclick="handleLogin()">
                        <i class="fas fa-sign-in-alt"></i> Войти
                    </button>
                </form>
                <p class="auth-link">
                    Нет аккаунта? <a href="#" onclick="showPage('register')">Зарегистрируйтесь</a>
                </p>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #666;">
                        <strong>Тестовые пользователи:</strong><br>
                        Администратор: admin / password123<br>
                        Менеджер: manager1 / password123<br>
                        Клиент: client1 / password123
                    </p>
                </div>
            </div>
        </section>
    `;
}

async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showNotification('Введите логин и пароль', 'error');
        return;
    }
    
    const data = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    
    if (data && data.token) {
        currentToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showNotification('Вход выполнен успешно!', 'success');
        showPage('dashboard');
    }
}

function loadRegisterPage() {
    mainContent.innerHTML = `
        <section class="page active">
            <div class="auth-container">
                <h2><i class="fas fa-user-plus"></i> Регистрация</h2>
                <form id="registerForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reg-fullname"><i class="fas fa-id-card"></i> ФИО</label>
                            <input type="text" id="reg-fullname" required>
                        </div>
                        <div class="form-group">
                            <label for="reg-username"><i class="fas fa-user"></i> Логин</label>
                            <input type="text" id="reg-username" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reg-email"><i class="fas fa-envelope"></i> Email</label>
                            <input type="email" id="reg-email" required>
                        </div>
                        <div class="form-group">
                            <label for="reg-phone"><i class="fas fa-phone"></i> Телефон</label>
                            <input type="tel" id="reg-phone" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reg-password"><i class="fas fa-lock"></i> Пароль</label>
                            <input type="password" id="reg-password" required>
                        </div>
                        <div class="form-group">
                            <label for="reg-role"><i class="fas fa-user-tag"></i> Роль</label>
                            <select id="reg-role" onchange="toggleManagerField()">
                                <option value="client">Клиент</option>
                                <option value="manager">Менеджер</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group" id="manager-field" style="display: none;">
                        <label for="reg-manager"><i class="fas fa-user-tie"></i> Менеджер (если есть)</label>
                        <select id="reg-manager">
                            <option value="">Выберите менеджера</option>
                        </select>
                    </div>
                    
                    <button type="button" class="btn btn-primary btn-block" onclick="handleRegister()">
                        <i class="fas fa-user-plus"></i> Зарегистрироваться
                    </button>
                </form>
                <p class="auth-link">
                    Уже есть аккаунт? <a href="#" onclick="showPage('login')">Войдите</a>
                </p>
            </div>
        </section>
    `;
    
    loadManagersForRegistration();
}

async function handleRegister() {
    const userData = {
        username: document.getElementById('reg-username').value,
        password: document.getElementById('reg-password').value,
        full_name: document.getElementById('reg-fullname').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        role: document.getElementById('reg-role').value,
        manager_id: document.getElementById('reg-manager').value || null
    };
    
    // Валидация
    for (const [key, value] of Object.entries(userData)) {
        if (key !== 'manager_id' && !value) {
            showNotification(`Заполните поле ${key}`, 'error');
            return;
        }
    }
    
    const data = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (data && data.token) {
        currentToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showNotification('Регистрация успешна!', 'success');
        showPage('dashboard');
    }
}

async function loadManagersForRegistration() {
    const data = await apiRequest('/api/managers');
    if (data && data.managers) {
        const select = document.getElementById('reg-manager');
        data.managers.forEach(manager => {
            const option = document.createElement('option');
            option.value = manager.id;
            option.textContent = `${manager.full_name} (${manager.email})`;
            select.appendChild(option);
        });
    }
}

function toggleManagerField() {
    const role = document.getElementById('reg-role').value;
    const managerField = document.getElementById('manager-field');
    managerField.style.display = role === 'client' ? 'block' : 'none';
}

function loadDashboardPage() {
    mainContent.innerHTML = `
        <section class="page active">
            <div class="dashboard-header">
                <div class="user-info">
                    <div class="user-avatar">
                        ${currentUser.full_name.charAt(0)}
                    </div>
                    <div class="user-details">
                        <h3>${currentUser.full_name}</h3>
                        <p>${getRoleName(currentUser.role)}</p>
                    </div>
                </div>
                <div>
                    <p>${new Date().toLocaleDateString('ru-RU', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>
            </div>
            
            <div class="stats-grid" id="stats-grid">
                <!-- Статистика загрузится динамически -->
            </div>
            
            <div class="table-container">
                <h3 style="padding: 20px 20px 0; margin: 0;">Последние заявки</h3>
                <div id="recent-applications">
                    <!-- Заявки загрузятся динамически -->
                </div>
            </div>
        </section>
    `;
    
    loadDashboardData();
}

async function loadDashboardData() {
    const appsData = await apiRequest('/api/applications');
    
    if (appsData && appsData.applications) {
        updateStats(appsData.applications);
        updateRecentApplications(appsData.applications.slice(0, 5));
    }
}

function updateStats(applications) {
    const statsGrid = document.getElementById('stats-grid');
    
    const stats = {
        total: applications.length,
        processing: applications.filter(a => a.status === 'В процессе').length,
        processed: applications.filter(a => a.status === 'Обработана').length,
        rejected: applications.filter(a => a.status === 'Отклонена').length
    };
    
    let statsHTML = '';
    
    if (currentUser.role === 'client') {
        statsHTML = `
            <div class="stat-card">
                <i class="fas fa-file-alt" style="color: #4361ee;"></i>
                <h3>${stats.total}</h3>
                <p>Всего заявок</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-clock" style="color: #f8961e;"></i>
                <h3>${stats.processing}</h3>
                <p>В процессе</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-check-circle" style="color: #4cc9f0;"></i>
                <h3>${stats.processed}</h3>
                <p>Обработано</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-times-circle" style="color: #f72585;"></i>
                <h3>${stats.rejected}</h3>
                <p>Отклонено</p>
            </div>
        `;
    } else if (currentUser.role === 'manager') {
        statsHTML = `
            <div class="stat-card">
                <i class="fas fa-users" style="color: #4361ee;"></i>
                <h3>${stats.total}</h3>
                <p>Заявок в работе</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-clock" style="color: #f8961e;"></i>
                <h3>${stats.processing}</h3>
                <p>Требуют внимания</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-check-circle" style="color: #4cc9f0;"></i>
                <h3>${stats.processed}</h3>
                <p>Завершено</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-chart-line" style="color: #7209b7;"></i>
                <h3>85%</h3>
                <p>Эффективность</p>
            </div>
        `;
    } else if (currentUser.role === 'admin') {
        statsHTML = `
            <div class="stat-card">
                <i class="fas fa-file-alt" style="color: #4361ee;"></i>
                <h3>${stats.total}</h3>
                <p>Всего заявок</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-users" style="color: #7209b7;"></i>
                <h3>${applications.length > 0 ? applications[0].client_id || 0 : 0}</h3>
                <p>Пользователей</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-check-circle" style="color: #4cc9f0;"></i>
                <h3>${stats.processed}</h3>
                <p>Завершено</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-ruble-sign" style="color: #f8961e;"></i>
                <h3>1.2M ₽</h3>
                <p>Оборот</p>
            </div>
        `;
    }
    
    statsGrid.innerHTML = statsHTML;
}

function updateRecentApplications(applications) {
    const container = document.getElementById('recent-applications');
    
    if (!applications || applications.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Нет заявок</p>';
        return;
    }
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Тип страховки</th>
                    ${currentUser.role !== 'client' ? '<th>Клиент</th>' : ''}
                    <th>Дата</th>
                    <th>Статус</th>
                    ${currentUser.role !== 'client' ? '<th>Действия</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;
    
    applications.forEach(app => {
        const statusClass = getStatusClass(app.status);
        const date = new Date(app.created_at).toLocaleDateString('ru-RU');
        
        tableHTML += `
            <tr>
                <td>#${app.id}</td>
                <td>${app.insurance_name || 'Не указан'}</td>
                ${currentUser.role !== 'client' ? `<td>${app.client_name || 'Не назначен'}</td>` : ''}
                <td>${date}</td>
                <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                ${currentUser.role !== 'client' ? `
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="viewApplication(${app.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${app.status === 'В процессе' ? `
                            <button class="btn btn-primary btn-sm" onclick="updateStatus(${app.id}, 'Обработана')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </td>
                ` : ''}
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

async function loadApplicationsPage() {
    const data = await apiRequest('/api/applications');
    
    let html = `
        <section class="page active">
            <div class="dashboard-header">
                <h2><i class="fas fa-file-alt"></i> Управление заявками</h2>
                ${currentUser.role === 'client' ? `
                    <button class="btn btn-primary" onclick="showPage('new-application')">
                        <i class="fas fa-plus-circle"></i> Новая заявка
                    </button>
                ` : ''}
            </div>
            
            <div class="table-container">
    `;
    
    if (!data || !data.applications || data.applications.length === 0) {
        html += '<p style="padding: 20px; text-align: center; color: #666;">Нет заявок</p>';
    } else {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Тип страховки</th>
                        ${currentUser.role !== 'client' ? '<th>Клиент</th>' : ''}
                        ${currentUser.role === 'admin' ? '<th>Менеджер</th>' : ''}
                        <th>Дата</th>
                        <th>Статус</th>
                        <th>Цена</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.applications.forEach(app => {
            const date = new Date(app.created_at).toLocaleDateString('ru-RU');
            const statusClass = getStatusClass(app.status);
            
            html += `
                <tr>
                    <td>#${app.id}</td>
                    <td>${app.insurance_name || 'Не указан'}</td>
                    ${currentUser.role !== 'client' ? `<td>${app.client_name || '—'}</td>` : ''}
                    ${currentUser.role === 'admin' ? `<td>${app.manager_name || 'Не назначен'}</td>` : ''}
                    <td>${date}</td>
                    <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                    <td>${app.price ? `${app.price} ₽` : '—'}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="viewApplication(${app.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${(currentUser.role === 'manager' || currentUser.role === 'admin') && app.status === 'В процессе' ? `
                            <button class="btn btn-primary btn-sm" onclick="updateStatus(${app.id}, 'Обработана')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="updateStatus(${app.id}, 'Отклонена')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
    }
    
    html += `
            </div>
        </section>
    `;
    
    mainContent.innerHTML = html;
}

async function updateStatus(appId, newStatus) {
    if (!confirm(`Изменить статус заявки #${appId} на "${newStatus}"?`)) {
        return;
    }
    
    const data = await apiRequest(`/api/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    });
    
    if (data) {
        showNotification('Статус обновлен', 'success');
        loadApplicationsPage();
        loadDashboardPage();
    }
}

async function viewApplication(appId) {
    // В этой упрощенной версии показываем только ID
    alert(`Просмотр заявки #${appId}\n\nВ полной версии здесь будет детальная информация о заявке.`);
}

async function loadUsersPage() {
    if (currentUser.role !== 'admin') {
        showNotification('Недостаточно прав', 'error');
        showPage('dashboard');
        return;
    }
    
    const data = await apiRequest('/api/users');
    
    let html = `
        <section class="page active">
            <div class="dashboard-header">
                <h2><i class="fas fa-users"></i> Управление пользователями</h2>
                <button class="btn btn-primary" onclick="showAddUserForm()">
                    <i class="fas fa-user-plus"></i> Добавить пользователя
                </button>
            </div>
            
            <div class="table-container">
    `;
    
    if (!data || !data.users || data.users.length === 0) {
        html += '<p style="padding: 20px; text-align: center; color: #666;">Нет пользователей</p>';
    } else {
        html += `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Логин</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th>Телефон</th>
                        <th>Дата регистрации</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.users.forEach(user => {
            const date = new Date(user.created_at).toLocaleDateString('ru-RU');
            
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.full_name}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${getRoleName(user.role)}</td>
                    <td>${user.phone || '—'}</td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})" ${user.role === 'admin' ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
    }
    
    html += `
            </div>
        </section>
    `;
    
    mainContent.innerHTML = html;
}

async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }
    
    const data = await apiRequest(`/api/users/${userId}`, {
        method: 'DELETE'
    });
    
    if (data) {
        showNotification('Пользователь удален', 'success');
        loadUsersPage();
    }
}

function showAddUserForm() {
    // Упрощенная форма добавления пользователя
    const html = prompt('Введите данные пользователя в формате:\nФИО,логин,email,роль(client/manager/admin),пароль');
    
    if (html) {
        const parts = html.split(',');
        if (parts.length === 5) {
            addUser({
                full_name: parts[0].trim(),
                username: parts[1].trim(),
                email: parts[2].trim(),
                role: parts[3].trim(),
                password: parts[4].trim()
            });
        } else {
            showNotification('Неверный формат данных', 'error');
        }
    }
}

async function addUser(userData) {
    const data = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (data) {
        showNotification('Пользователь добавлен', 'success');
        loadUsersPage();
    }
}

function editUser(userId) {
    alert(`Редактирование пользователя #${userId}\n\nВ полной версии здесь будет форма редактирования.`);
}

function loadProfilePage() {
    mainContent.innerHTML = `
        <section class="page active">
            <div class="auth-container">
                <h2><i class="fas fa-user"></i> Мой профиль</h2>
                <div class="user-info" style="margin-bottom: 20px;">
                    <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem;">
                        ${currentUser.full_name.charAt(0)}
                    </div>
                    <div class="user-details">
                        <h3>${currentUser.full_name}</h3>
                        <p>${getRoleName(currentUser.role)}</p>
                        <p><i class="fas fa-envelope"></i> ${currentUser.email}</p>
                        ${currentUser.phone ? `<p><i class="fas fa-phone"></i> ${currentUser.phone}</p>` : ''}
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">Действия</h3>
                    <div class="form-buttons">
                        <button class="btn btn-outline" onclick="showPage('dashboard')">
                            <i class="fas fa-arrow-left"></i> Назад
                        </button>
                        <button class="btn btn-primary" onclick="changePassword()">
                            <i class="fas fa-key"></i> Сменить пароль
                        </button>
                        <button class="btn btn-danger" onclick="logout()">
                            <i class="fas fa-sign-out-alt"></i> Выйти
                        </button>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function changePassword() {
    const newPassword = prompt('Введите новый пароль:');
    if (newPassword) {
        alert('Пароль изменен (в реальной системе здесь будет API запрос)');
    }
}

function loadNewApplicationPage() {
    mainContent.innerHTML = `
        <section class="page active">
            <div class="auth-container">
                <h2><i class="fas fa-plus-circle"></i> Новая заявка на страховку</h2>
                <form id="newApplicationForm">
                    <div class="form-group">
                        <label for="app-type"><i class="fas fa-shield-alt"></i> Тип страховки</label>
                        <select id="app-type" required>
                            <option value="">Выберите тип</option>
                            <option value="1">Дом</option>
                            <option value="2">Автомобиль - ОСАГО</option>
                            <option value="3">Автомобиль - КАСКО</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="app-details"><i class="fas fa-file-alt"></i> Дополнительная информация</label>
                        <textarea id="app-details" rows="4" placeholder="Опишите объект страхования..." required></textarea>
                    </div>
                    
                    <div class="form-buttons">
                        <button type="button" class="btn btn-outline" onclick="showPage('applications')">
                            <i class="fas fa-arrow-left"></i> Назад
                        </button>
                        <button type="button" class="btn btn-primary" onclick="submitNewApplication()">
                            <i class="fas fa-paper-plane"></i> Отправить заявку
                        </button>
                    </div>
                </form>
            </div>
        </section>
    `;
}

async function submitNewApplication() {
    const type = document.getElementById('app-type').value;
    const details = document.getElementById('app-details').value;
    
    if (!type || !details) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    const applicationData = {
        insurance_type_id: parseInt(type),
        insurance_subtype: 'стандарт',
        details: { description: details }
    };
    
    const data = await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData)
    });
    
    if (data) {
        showNotification('Заявка успешно создана!', 'success');
        showPage('applications');
    }
}

// Header
function updateHeader() {
    if (currentUser) {
        header.innerHTML = `
            <div class="logo">
                <i class="fas fa-shield-alt"></i>
                <h1>Страховочка</h1>
            </div>
            <nav class="nav">
                <a href="#" class="nav-link ${!window.location.hash || window.location.hash === '#home' ? 'active' : ''}" onclick="showPage('dashboard')">
                    <i class="fas fa-tachometer-alt"></i> Панель
                </a>
                <a href="#" class="nav-link" onclick="showPage('applications')">
                    <i class="fas fa-file-alt"></i> Заявки
                </a>
                ${currentUser.role === 'admin' ? `
                    <a href="#" class="nav-link" onclick="showPage('users')">
                        <i class="fas fa-users"></i> Пользователи
                    </a>
                ` : ''}
                ${currentUser.role === 'client' ? `
                    <a href="#" class="nav-link" onclick="showPage('new-application')">
                        <i class="fas fa-plus-circle"></i> Новая заявка
                    </a>
                ` : ''}
                <a href="#" class="nav-link" onclick="showPage('profile')">
                    <i class="fas fa-user"></i> Профиль
                </a>
            </nav>
            <div class="auth-buttons">
                <button class="btn btn-outline" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Выйти
                </button>
            </div>
        `;
    } else {
        header.innerHTML = `
            <div class="logo">
                <i class="fas fa-shield-alt"></i>
                <h1>Страховочка</h1>
            </div>
            <nav class="nav">
                <a href="#" class="nav-link active" onclick="showPage('home')">
                    <i class="fas fa-home"></i> Главная
                </a>
                <a href="#" class="nav-link" onclick="showPage('login')">
                    <i class="fas fa-sign-in-alt"></i> Вход
                </a>
                <a href="#" class="nav-link" onclick="showPage('register')">
                    <i class="fas fa-user-plus"></i> Регистрация
                </a>
            </nav>
            <div class="auth-buttons">
                <button class="btn btn-outline" onclick="showPage('login')">
                    <i class="fas fa-sign-in-alt"></i> Вход
                </button>
                <button class="btn btn-primary" onclick="showPage('register')">
                    <i class="fas fa-user-plus"></i> Регистрация
                </button>
            </div>
        `;
    }
}

// Выход
async function logout() {
    await apiRequest('/api/logout', {
        method: 'POST'
    });
    
    currentUser = null;
    currentToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    showNotification('Выход выполнен', 'success');
    showPage('home');
}

// Проверка авторизации при загрузке
async function checkAuth() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        // В реальной системе здесь должна быть проверка токена через API
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        
        // Проверяем токен
        const data = await apiRequest('/api/me');
        if (!data) {
            // Токен невалидный
            logout();
            return;
        }
    }
    
    updateHeader();
    showPage('home');
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});