import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from marketplace.models import Product

def seed():
    print("Seeding Django database with demo users & marketplace items...")

    # Superuser / Admin
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@campusplace.kz',
            password='admin',
            full_name='Администратор Кампуса',
            is_verified=True
        )
        print("Created superuser: admin / admin")

    # Student 1
    u1, _ = User.objects.get_or_create(
        email='arman.student@satbayev.university.kz',
        defaults={
            'username': 'arman.student@satbayev.university.kz',
            'full_name': 'Арман Сейткалиев',
            'university': 'Satbayev University',
            'faculty': 'Информационные технологии',
            'dormitory': 'Общежитие №2, комната 412',
            'phone': '+7 (707) 123-45-67',
            'telegram': '@arman_tech',
            'avatar_url': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
            'is_verified': True
        }
    )
    u1.set_password('student123')
    u1.save()

    # Student 2
    u2, _ = User.objects.get_or_create(
        email='diana.math@kaznu.kz',
        defaults={
            'username': 'diana.math@kaznu.kz',
            'full_name': 'Диана Касымова',
            'university': 'КазНУ им. аль-Фараби',
            'faculty': 'Механико-математический',
            'dormitory': 'Общежитие №8, комната 205',
            'phone': '+7 (777) 987-65-43',
            'telegram': '@diana_math',
            'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
            'is_verified': True
        }
    )
    u2.set_password('student123')
    u2.save()

    # Student 3
    u3, _ = User.objects.get_or_create(
        email='sanzhar@gmail.com',
        defaults={
            'username': 'sanzhar@gmail.com',
            'full_name': 'Санжар Болатов',
            'university': 'МУИТ (IITU)',
            'faculty': 'Кибербезопасность',
            'dormitory': 'Съемная квартира рядом с кампусом',
            'phone': '+7 (701) 555-88-99',
            'telegram': '@sanzhar_b',
            'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
            'is_verified': False
        }
    )
    u3.set_password('student123')
    u3.save()

    # Products
    if Product.objects.count() == 0:
        products = [
            Product(
                seller=u2,
                title="Учебник: Высшая математика (Том 1, 2) + задачник",
                description="Отличное состояние, все страницы целые, без пометок ручкой. Очень помог сдать экзамен на А. Отдам вместе с конспектами лекций!",
                price=3500,
                category="Учебники",
                condition="Отличное",
                location="Главный кампус КазНУ",
                images=[
                    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
                ],
                views_count=34
            ),
            Product(
                seller=u1,
                title="Наушники Sony WH-1000XM4 (Шумоподавление для учебы)",
                description="Идеально для подготовки в библиотеке или шумном общежитии. Активное шумоподавление, батарею держат до 30 часов. В комплекте чехол и кабель.",
                price=65000,
                category="Электроника",
                condition="Отличное",
                location="Общежитие №2, Satbayev",
                images=[
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
                ],
                views_count=89
            ),
            Product(
                seller=u1,
                title="Настольная лампа Xiaomi LED Desk Lamp 1S",
                description="Удобная регулировка яркости и цветовой температуры через регулятор или приложение. Отлично освещает рабочий стол в общежитии, глаза не устают.",
                price=7500,
                category="Для комнаты",
                condition="Новое",
                location="Кампус Satbayev",
                images=[
                    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
                ],
                views_count=19
            ),
            Product(
                seller=u3,
                title="Толстовка с университетским логотипом (Oversize M)",
                description="Тёплая университетская худи, надевалась пару раз на фестивали. Качественный плотный хлопок с начесом.",
                price=8000,
                category="Одежда",
                condition="Как новое",
                location="МУИТ / Байтурсынова",
                images=[
                    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"
                ],
                views_count=12
            ),
            Product(
                seller=u2,
                title="Электрический чайник Bosch 1.7L для общаги",
                description="Быстро кипятит воду, чистый фильтр от накипи, защита от включения без воды. Незаменимая вещь в комнату общежития.",
                price=4500,
                category="Для комнаты",
                condition="Хорошее",
                location="Общежитие №8, КазНУ",
                images=[
                    "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80"
                ],
                views_count=42
            ),
            Product(
                seller=u1,
                title="Графический планшет Wacom One для дизайнеров и заметок",
                description="Подходит для создания диджитал рисунков, скетчей и рисования формул в онлайн лекциях. Стилус не требует зарядки, комплект наконечников.",
                price=22000,
                category="Электроника",
                condition="Отличное",
                location="Satbayev кампус",
                images=[
                    "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=800&q=80"
                ],
                views_count=57
            )
        ]
        Product.objects.bulk_create(products)
        print(f"Created {len(products)} products in Django database!")

if __name__ == '__main__':
    seed()
