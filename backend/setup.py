from setuptools import setup, find_packages

setup(
    name="strahovochka",
    version="1.0.0",
    description="Система управления клиентскими данными для страховой компании",
    author="Страховочка Team",
    author_email="info@strahovochka.ru",
    packages=find_packages(),
    install_requires=[
        "flask>=2.3.3",
        "flask-cors>=4.0.0",
        "flask-jwt-extended>=4.5.2",
        "psycopg2-binary>=2.9.7",
        "python-dotenv>=1.0.0",
        "bcrypt>=4.1.2",
    ],
    extras_require={
        "dev": ["pytest>=7.4.3", "black>=23.9.1", "flake8>=6.1.0", "pytest-cov>=4.1.0"],
        "prod": ["gunicorn>=20.1.0", "whitenoise>=6.5.0"],
    },
    entry_points={
        "console_scripts": [
            "strahovochka=server:run_server",
            "strahovochka-init=database:init_database",
        ]
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Insurance Companies",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Office/Business :: Financial :: Insurance",
    ],
    python_requires=">=3.8",
)