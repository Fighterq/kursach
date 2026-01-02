import subprocess
import sys


def check_formatting():
    """Проверка форматирования кода"""
    print("🔍 Проверка форматирования кода...")

    try:
        # Проверяем форматирование
        result = subprocess.run(
            ["black", "--check", "."], capture_output=True, text=True, cwd="backend"
        )

        if result.returncode != 0:
            print("❌ Обнаружены проблемы с форматированием:")
            print(result.stdout)
            print(result.stderr)

            # Предлагаем автоматически исправить
            fix = input("📝 Автоматически исправить форматирование? (y/n): ")
            if fix.lower() == "y":
                subprocess.run(["black", "."], cwd="backend")
                print("✅ Форматирование исправлено")
                return True
            else:
                return False
        else:
            print("✅ Форматирование в порядке!")
            return True

    except FileNotFoundError:
        print("⚠️ Black не установлен. Устанавливаем...")
        subprocess.run([sys.executable, "-m", "pip", "install", "black"])
        return check_formatting()


def check_linting():
    """Проверка стиля кода"""
    print("\n🔍 Проверка стиля кода...")

    try:
        result = subprocess.run(
            ["flake8", "."], capture_output=True, text=True, cwd="backend"
        )

        if result.stdout:
            print("⚠️ Предупреждения стиля:")
            print(result.stdout)
        else:
            print("✅ Стиль кода в порядке!")

    except FileNotFoundError:
        print("⚠️ Flake8 не установлен. Пропускаем проверку...")


if __name__ == "__main__":
    print("=" * 50)
    print("Проверка качества кода проекта 'Страховочка'")
    print("=" * 50)

    format_ok = check_formatting()
    check_linting()

    if format_ok:
        print("\n✅ Проверка завершена успешно!")
        sys.exit(0)
    else:
        print("\n❌ Проблемы с форматированием кода!")
        sys.exit(1)
