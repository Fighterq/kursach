# Makefile для системы "Страховочка"
# Команда: make <цель>

.PHONY: help install dev prod test lint format clean run setup docker-build docker-run

# Цвета для вывода
GREEN=\033[0;32m
RED=\033[0;31m
NC=\033[0m # No Color

help: ## Показать справку по командам
	@echo "$(GREEN)Система сборки Страховочка$(NC)"
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

setup: ## Установить Python и зависимости
	@echo "$(GREEN)Установка системы...$(NC)"
	@which python3 || (echo "$(RED)Python3 не установлен$(NC)" && exit 1)
	@cd backend && pip install --upgrade pip && pip install -r requirements.txt
	@echo "$(GREEN)Установка завершена!$(NC)"

install: setup ## Установить все зависимости (синоним setup)

dev: ## Установить зависимости для разработки
	@echo "$(GREEN)Установка зависимостей для разработки...$(NC)"
	@cd backend && pip install -r requirements-dev.txt
	@echo "$(GREEN)Готово!$(NC)"

prod: ## Установить зависимости для продакшена
	@echo "$(GREEN)Установка продакшен зависимостей...$(NC)"
	@cd backend && pip install gunicorn whitenoise
	@echo "$(GREEN)Готово!$(NC)"

test: ## Запустить тесты
	@echo "$(GREEN)Запуск тестов...$(NC)"
	@cd backend && python -m pytest tests/ -v --cov=. --cov-report=html
	@echo "$(GREEN)Тесты завершены!$(NC)"

lint: ## Проверить код линтером
	@echo "$(GREEN)Проверка кода...$(NC)"
	@cd backend && python -m flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	@cd backend && python -m flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	@echo "$(GREEN)Проверка завершена!$(NC)"

format: ## Форматировать код
	@echo "$(GREEN)Форматирование кода...$(NC)"
	@cd backend && python -m black .
	@echo "$(GREEN)Форматирование завершено!$(NC)"

clean: ## Очистить проект от временных файлов
	@echo "$(GREEN)Очистка проекта...$(NC)"
	@rm -rf backend/__pycache__
	@rm -rf backend/*.pyc
	@rm -rf backend/.coverage
	@rm -rf backend/htmlcov
	@rm -rf backend/.pytest_cache
	@rm -f strahovochka.db
	@rm -f backend/strahovochka.db
	@echo "$(GREEN)Очистка завершена!$(NC)"

run: ## Запустить сервер в режиме разработки
	@echo "$(GREEN)Запуск сервера разработки...$(NC)"
	@cd backend && python server.py

run-prod: ## Запустить сервер в режиме продакшена
	@echo "$(GREEN)Запуск продакшен сервера...$(NC)"
	@cd backend && gunicorn --bind 0.0.0.0:5000 server:app

init-db: ## Инициализировать базу данных
	@echo "$(GREEN)Инициализация базы данных...$(NC)"
	@cd backend && python -c "from database import db; db.init_db()"
	@echo "$(GREEN)База данных создана!$(NC)"

backup: ## Создать резервную копию базы данных
	@echo "$(GREEN)Создание резервной копии...$(NC)"
	@cp strahovochka.db strahovochka_backup_$$(date +%Y%m%d_%H%M%S).db
	@echo "$(GREEN)Резервная копия создана!$(NC)"

deploy: clean install test lint ## Развернуть проект (полный цикл)
	@echo "$(GREEN)Развертывание проекта...$(NC)"
	@make init-db
	@echo "$(GREEN)Проект готов к запуску! Используйте 'make run'$(NC)"

docker-build: ## Собрать Docker образ
	@echo "$(GREEN)Сборка Docker образа...$(NC)"
	@docker build -t strahovochka:latest .

docker-run: ## Запустить в Docker
	@echo "$(GREEN)Запуск в Docker...$(NC)"
	@docker run -p 5000:5000 strahovochka:latest

build-all: clean install test lint format ## Полная сборка проекта
	@echo "$(GREEN)Полная сборка завершена успешно!$(NC)"

# Специальные цели для Windows
windows-setup: ## Установка на Windows
	@echo "$(GREEN)Установка на Windows...$(NC)"
	@py -m pip install --upgrade pip
	@cd backend && py -m pip install -r requirements.txt
	@echo "$(GREEN)Установка завершена!$(NC)"

windows-run: ## Запуск на Windows
	@echo "$(GREEN)Запуск сервера на Windows...$(NC)"
	@cd backend && py server.py

# Отчеты
coverage: ## Показать отчет о покрытии тестами
	@echo "$(GREEN)Генерация отчета о покрытии...$(NC)"
	@cd backend && python -m pytest --cov=. --cov-report=html
	@echo "$(GREEN)Отчет создан: backend/htmlcov/index.html$(NC)"

docs: ## Сгенерировать документацию
	@echo "$(GREEN)Генерация документации...$(NC)"
	@mkdir -p docs
	@pydoc-markdown
	@echo "$(GREEN)Документация создана в папке docs/$(NC)"