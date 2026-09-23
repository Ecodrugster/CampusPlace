import json
import os
import sys
from database import SessionLocal, Base, engine
import models
from auth import get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if already seeded
    if db.query(models.User).count() == 0:
        print("Seeding initial demo data...")
        # 1. Create demo users
        user1 = models.User(
            email="arman.student@satbayev.university.kz",
            hashed_password=get_password_hash("student123"),
            full_name="Арман Сейткалиев",
            university="Satbayev University",
            faculty="Информационные технологии",
            dormitory="Общежитие №2, комната 412",
            phone="+7 (707) 123-45-67",
            telegram="@arman_tech",
            avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
            is_verified=True
        )

        user2 = models.User(
            email="diana.math@kaznu.kz",
            hashed_password=get_password_hash("student123"),
            full_name="Диана Касымова",
            university="КазНУ им. аль-Фараби",
            faculty="Механико-математический",
            dormitory="Общежитие №8, комната 205",
            phone="+7 (777) 987-65-43",
            telegram="@diana_math",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
            is_verified=True
        )

        user3 = models.User(
            email="sanzhar@gmail.com",
            hashed_password=get_password_hash("student123"),
            full_name="Санжар Болатов",
            university="МУИТ (IITU)",
            faculty="Кибербезопасность",
            dormitory="Съемная квартира рядом с кампусом",
            phone="+7 (701) 555-88-99",
            telegram="@sanzhar_b",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            is_verified=False
        )

        db.add_all([user1, user2, user3])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(user3)

        # 2. Create products
        products = [
            models.Product(
                title="Учебник: Высшая математика (Том 1, 2) + задачник",
                description="Отличное состояние, все страницы целые, без пометок ручкой. Очень помог сдать экзамен на А. Отдам вместе с конспектами лекций!",
                price=3500,
                category="Учебники",
                condition="Отличное",
                location="Главный кампус КазНУ",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=34,
                seller_id=user2.id
            ),
            models.Product(
                title="Наушники Sony WH-1000XM4 (Шумоподавление для учебы)",
                description="Идеально для подготовки в библиотеке или шумном общежитии. Активное шумоподавление, батарею держат до 30 часов. В комплекте чехол и кабель.",
                price=65000,
                category="Электроника",
                condition="Отличное",
                location="Общежитие №2, Satbayev",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=89,
                seller_id=user1.id
            ),
            models.Product(
                title="Настольная лампа Xiaomi LED Desk Lamp 1S",
                description="Удобная регулировка яркости и цветовой температуры через регулятор или приложение. Отлично освещает рабочий стол в общежитии, глаза не устают.",
                price=7500,
                category="Для комнаты",
                condition="Новое",
                location="Кампус Satbayev",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=19,
                seller_id=user1.id
            ),
            models.Product(
                title="Толстовка с университетским логотипом (Oversize M)",
                description="Тёплая университетская худи, надевалась пару раз на фестивали. Качественный плотный хлопок с начесом.",
                price=8000,
                category="Одежда",
                condition="Как новое",
                location="МУИТ / Байтурсынова",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=12,
                seller_id=user3.id
            ),
            models.Product(
                title="Электрический чайник Bosch 1.7L для общаги",
                description="Быстро кипятит воду, чистый фильтр от накипи, защита от включения без воды. Незаменимая вещь в комнату общежития.",
                price=4500,
                category="Для комнаты",
                condition="Хорошее",
                location="Общежитие №8, КазНУ",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=42,
                seller_id=user2.id
            ),
            models.Product(
                title="Графический планшет Wacom One для дизайнеров и заметок",
                description="Подходит для создания диджитал рисунков, скетчей и рисования формул в онлайн лекциях. Стилус не требует зарядки, комплект наконечников.",
                price=22000,
                category="Электроника",
                condition="Отличное",
                location="Satbayev кампус",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=57,
                seller_id=user1.id
            ),
            models.Product(
                title="Учебник: Алгоритмы и структуры данных (Кормен, Лейзерсон)",
                description="Фундаментальный труд для программистов. Твердый переплет, русский перевод. Незаменим при подготовке к собеседованиям в FAANG.",
                price=11000,
                category="Учебники",
                condition="Отличное",
                location="МУИТ (IITU)",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=68,
                seller_id=user3.id
            ),
            models.Product(
                title="Бадминтонный набор (2 ракетки + чехол + воланы)",
                description="Играли весной на стадионе кампуса. Состояние хорошее, натянуты качественные струны Yonex.",
                price=5000,
                category="Спорт и хобби",
                condition="Хорошее",
                location="Главный кампус КазНУ",
                images=json.dumps([
                    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80"
                ]),
                status="active",
                views_count=23,
                seller_id=user2.id
            )
        ]

        db.add_all(products)
        db.commit()
        print("Database seeded with sample users and products!")
    else:
        print("Database already contains data, skipping seed.")
finally:
    db.close()
