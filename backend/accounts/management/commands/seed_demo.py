"""
Fill CampusPlace with realistic demo data (idempotent-ish).

Usage:
  python manage.py seed_demo
  python manage.py seed_demo --password student123
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from marketplace.models import Product, Favorite
from reviews.models import Review
from chat.models import Conversation, Message
from moderation.models import Report


DEMO_PASSWORD_DEFAULT = "student123"

STUDENTS = [
    {
        "email": "arman.student@satbayev.university.kz",
        "full_name": "Арман Сейткалиев",
        "university": "Satbayev University",
        "faculty": "Информационные технологии",
        "dormitory": "Общежитие №2",
        "phone": "+7 707 123 45 67",
        "telegram": "@arman_tech",
        "is_verified": True,
        "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "diana.math@kaznu.kz",
        "full_name": "Диана Касымова",
        "university": "КазНУ им. аль-Фараби",
        "faculty": "Механико-математический",
        "dormitory": "Общежитие №8",
        "phone": "+7 777 987 65 43",
        "telegram": "@diana_math",
        "is_verified": True,
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "sanzhar@iitu.kz",
        "full_name": "Санжар Болатов",
        "university": "МУИТ (IITU)",
        "faculty": "Кибербезопасность",
        "dormitory": "Студгородок IITU",
        "phone": "+7 701 555 88 99",
        "telegram": "@sanzhar_b",
        "is_verified": True,
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "aisha.design@kbtu.kz",
        "full_name": "Айша Нурланова",
        "university": "КБТУ",
        "faculty": "Дизайн и медиа",
        "dormitory": "Общежитие КБТУ А",
        "phone": "+7 705 222 11 00",
        "telegram": "@aisha_des",
        "is_verified": True,
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "timur.sport@satbayev.university.kz",
        "full_name": "Тимур Алиев",
        "university": "Satbayev University",
        "faculty": "Горное дело",
        "dormitory": "Общежитие №1",
        "phone": "+7 747 333 22 11",
        "telegram": "@timur_run",
        "is_verified": False,
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "madina.lang@kaznu.kz",
        "full_name": "Мадина Ермекова",
        "university": "КазНУ им. аль-Фараби",
        "faculty": "Филология",
        "dormitory": "Общежитие №9",
        "phone": "+7 778 444 55 66",
        "telegram": "@madina_kz",
        "is_verified": True,
        "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "nurlan.biz@narxoz.kz",
        "full_name": "Нурлан Сагындыков",
        "university": "Narxoz University",
        "faculty": "Бизнес и менеджмент",
        "dormitory": "Общежитие Narxoz",
        "phone": "+7 700 101 20 30",
        "telegram": "@nurlan_biz",
        "is_verified": True,
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "sara.med@kaznmu.kz",
        "full_name": "Сара Жумабекова",
        "university": "КазНМУ",
        "faculty": "Общая медицина",
        "dormitory": "Общежитие медкампуса",
        "phone": "+7 702 888 77 66",
        "telegram": "@sara_med",
        "is_verified": False,
        "avatar_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
    },
]

# (seller_email, title, category, price, condition, location, views, status, images, description)
PRODUCTS = [
    # Для учёбы
    ("diana.math@kaznu.kz", "Высшая математика — том 1–2 + задачник", "Для учёбы", 4500, "Отличное", "КазНУ, главный корпус", 48, "active",
     ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"],
     "Комплект для 1 курса. Страницы целые, есть лёгкие карандашные пометки."),
    ("arman.student@satbayev.university.kz", "Конспекты по алгоритмам и структурам данных", "Для учёбы", 2500, "Хорошее", "Satbayev, библиотека", 67, "active",
     ["https://images.unsplash.com/photo-1456513080600-7f39ce011615?auto=format&fit=crop&w=800&q=80"],
     "Печатные конспекты + PDF на флешке. Помогли сдать midterm на A-."),
    ("madina.lang@kaznu.kz", "Словарь IELTS Academic + тесты", "Для учёбы", 3200, "Как новое", "КазНУ, филолфак", 22, "active",
     ["https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80"],
     "Почти не пользовалась, внутри чистый. Отдам с наклейками-закладками."),
    ("sara.med@kaznmu.kz", "Атлас анатомии Sobotta (б/у)", "Для учёбы", 18000, "Хорошее", "КазНМУ", 91, "active",
     ["https://images.unsplash.com/photo-1532012197267-acfcc9b8d938?auto=format&fit=crop&w=800&q=80"],
     "Тяжёлый, но нужный. Есть подчеркивания маркером на 10% страниц."),
    ("sanzhar@iitu.kz", "Калькулятор Casio fx-991EX", "Для учёбы", 9000, "Отличное", "IITU", 55, "active",
     ["https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=800&q=80"],
     "Для инженерии и статистики. Комплект: чехол + инструкция."),

    # Женщинам
    ("aisha.design@kbtu.kz", "Платье летнее Zara, размер S", "Женщинам", 12000, "Как новое", "КБТУ", 33, "active",
     ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"],
     "Надевала 2 раза на ивенты. Без пятен, можно мерить в холле."),
    ("madina.lang@kaznu.kz", "Джинсы mom-fit, размер 28", "Женщинам", 7000, "Отличное", "КазНУ общага №9", 18, "active",
     ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80"],
     "Удобные на каждый день, высокая посадка."),
    ("sara.med@kaznmu.kz", "Куртка демисезонная, M", "Женщинам", 15000, "Хорошее", "Медкампус", 41, "active",
     ["https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=800&q=80"],
     "Тёплая на весну/осень. Капюшон съёмный."),
    ("aisha.design@kbtu.kz", "Свитер oversize бежевый", "Женщинам", 5500, "Новое", "КБТУ", 12, "active",
     ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80"],
     "Бирка на месте, не подошёл по цвету."),

    # Мужчинам
    ("timur.sport@satbayev.university.kz", "Худи оверсайз чёрное, L", "Мужчинам", 9000, "Отличное", "Satbayev общага №1", 29, "active",
     ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"],
     "Плотный хлопок, после стирки не село."),
    ("nurlan.biz@narxoz.kz", "Рубашка под собесы, M", "Мужчинам", 6000, "Как новое", "Narxoz", 15, "active",
     ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"],
     "Надела один раз на презентацию стартапа."),
    ("sanzhar@iitu.kz", "Куртка bomber, L", "Мужчинам", 14000, "Хорошее", "IITU", 37, "active",
     ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"],
     "На вечерние прогулки по кампусу, лёгкие следы носки."),
    ("arman.student@satbayev.university.kz", "Спортивные штаны Nike, M", "Мужчинам", 8000, "Отличное", "Satbayev спортзал", 24, "active",
     ["https://images.unsplash.com/photo-1506629082955-511b1aa922c8?auto=format&fit=crop&w=800&q=80"],
     "Для зала и утра. Карманы на молнии."),

    # Обувь
    ("timur.sport@satbayev.university.kz", "Кроссовки Nike Revolution, 42", "Обувь", 25000, "Как новое", "Satbayev", 76, "active",
     ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"],
     "Носил месяц, подошва целая, коробка есть."),
    ("aisha.design@kbtu.kz", "Белые кеды Convers, 38", "Обувь", 11000, "Хорошее", "КБТУ", 44, "active",
     ["https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=800&q=80"],
     "Классика под любой look. Можно отбелить."),
    ("nurlan.biz@narxoz.kz", "Туфли офисные, 43", "Обувь", 13000, "Отличное", "Narxoz", 19, "active",
     ["https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=800&q=80"],
     "Для практики и презентаций. Надевал 3 раза."),
    ("sara.med@kaznmu.kz", "Тапочки для общаги, 37", "Обувь", 2000, "Новое", "КазНМУ общага", 9, "active",
     ["https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80"],
     "Мягкие, не скользят по кафелю."),

    # Красота
    ("madina.lang@kaznu.kz", "Набор уходовой косметики (крем + сыворотка)", "Красота", 4500, "Новое", "КазНУ", 27, "active",
     ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80"],
     "Заказывала дубль по ошибке, запечатано."),
    ("aisha.design@kbtu.kz", "Фен Dyson-style компактный", "Красота", 16000, "Отличное", "КБТУ", 52, "active",
     ["https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=800&q=80"],
     "Быстро сушит, тихий. Чехол в комплекте."),
    ("sara.med@kaznmu.kz", "Электрическая зубная щётка Oral-B", "Красота", 7000, "Как новое", "Медкампус", 14, "active",
     ["https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80"],
     "Пользовалась 2 недели, насадки новые."),
    ("diana.math@kaznu.kz", "Парфюм миниатюра 30 мл", "Красота", 5500, "Хорошее", "КазНУ", 21, "active",
     ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80"],
     "Осталось ~70%, аромат свежий цитрус."),

    # Аксессуары
    ("arman.student@satbayev.university.kz", "Наушники Sony WH-1000XM4", "Аксессуары", 65000, "Отличное", "Satbayev общага №2", 120, "active",
     ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"],
     "Шумодав для библиотеки. Чехол и кабель в комплекте."),
    ("sanzhar@iitu.kz", "Рюкзак городской 25L", "Аксессуары", 10000, "Хорошее", "IITU", 38, "active",
     ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"],
     "Отсек под ноутбук 15\", водоотталкивающая ткань."),
    ("aisha.design@kbtu.kz", "Сумка шоппер холщовая", "Аксессуары", 2500, "Новое", "КБТУ", 11, "active",
     ["https://images.unsplash.com/photo-1590874103328-eac38a67429f?auto=format&fit=crop&w=800&q=80"],
     "Под учебники и скетчбук."),
    ("nurlan.biz@narxoz.kz", "Часы Casio цифровые", "Аксессуары", 8000, "Отличное", "Narxoz", 26, "active",
     ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"],
     "Лёгкие, батарея свежая."),
    ("timur.sport@satbayev.university.kz", "Бутылка термо 750 мл", "Аксессуары", 3500, "Как новое", "Satbayev", 17, "active",
     ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80"],
     "Держит тепло до 8 часов, не течёт в рюкзаке."),

    # Мебель
    ("diana.math@kaznu.kz", "Настольная лампа Xiaomi LED 1S", "Мебель", 7500, "Новое", "КазНУ общага №8", 45, "active",
     ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"],
     "Регулировка яркости, глаза не устают за ночными сессиями."),
    ("arman.student@satbayev.university.kz", "Полка навесная для книг", "Мебель", 4000, "Хорошее", "Satbayev", 20, "active",
     ["https://images.unsplash.com/photo-1595428774223-ef526ba620aa?auto=format&fit=crop&w=800&q=80"],
     "Дерево, крепления в комплекте."),
    ("sanzhar@iitu.kz", "Стул складной для комнаты", "Мебель", 6000, "Отличное", "IITU", 16, "active",
     ["https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80"],
     "Компактно складывается, выдержит ноутбук + учебники."),
    ("madina.lang@kaznu.kz", "Электрический чайник 1.7L", "Мебель", 4500, "Хорошее", "КазНУ общага №9", 58, "active",
     ["https://images.unsplash.com/photo-1578022761797-b8636ac1773c?auto=format&fit=crop&w=800&q=80"],
     "Быстро кипятит, фильтр от накипи чистый."),
    ("nurlan.biz@narxoz.kz", "Органайзер для стола 5 отделений", "Мебель", 1800, "Новое", "Narxoz", 8, "active",
     ["https://images.unsplash.com/photo-1518455027359-f3f8164ba9bd?auto=format&fit=crop&w=800&q=80"],
     "Под ручки, зарядки и стикеры."),

    # Электроника
    ("arman.student@satbayev.university.kz", "Графический планшет Wacom One", "Электроника", 22000, "Отличное", "Satbayev", 73, "active",
     ["https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=800&q=80"],
     "Для скетчей и формул на онлайн-парах. Стилус без зарядки."),
    ("sanzhar@iitu.kz", "Клавиатура механическая Keychron K2", "Электроника", 28000, "Как новое", "IITU", 64, "active",
     ["https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80"],
     "Bluetooth + кабель, для кодинга ночью."),
    ("timur.sport@satbayev.university.kz", "Умные часы фитнес-браслет", "Электроника", 12000, "Хорошее", "Satbayev", 31, "active",
     ["https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80"],
     "Шаги, пульс, уведомления. Ремешок новый."),
    ("aisha.design@kbtu.kz", "Кольцевая лампа 26 см + штатив", "Электроника", 9000, "Отличное", "КБТУ", 28, "reserved",
     ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80"],
     "Для съёмок портфолио и стримов. Забронировано до встречи."),

    # Спорт и хобби
    ("timur.sport@satbayev.university.kz", "Гантели разборные 2×10 кг", "Спорт и хобби", 15000, "Хорошее", "Satbayev спорткомплекс", 40, "active",
     ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80"],
     "Для комнатных тренировок, блины в комплекте."),
    ("nurlan.biz@narxoz.kz", "Йога-мат нескользящий", "Спорт и хобби", 3500, "Как новое", "Narxoz", 13, "active",
     ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80"],
     "Толстый, удобно для растяжки после пар."),
    ("diana.math@kaznu.kz", "Настольная игра «Alias»", "Спорт и хобби", 4000, "Отличное", "КазНУ", 22, "sold",
     ["https://images.unsplash.com/photo-1611996575749-79a3a250f08b?auto=format&fit=crop&w=800&q=80"],
     "Уже продано соседке по этажу — оставлено для истории сделок."),
]

REVIEW_SPECS = [
    # (reviewer_email, seller_email, product_title_contains, rating, comment)
    ("arman.student@satbayev.university.kz", "diana.math@kaznu.kz", "Высшая математика", 5, "Всё как в описании, встретились быстро у библиотеки."),
    ("diana.math@kaznu.kz", "arman.student@satbayev.university.kz", "Наушники Sony", 5, "Отличный продавец, дал проверить шумодав на месте."),
    ("sanzhar@iitu.kz", "aisha.design@kbtu.kz", "Платье летнее", 4, "Размер сел, небольшая задержка на 15 минут."),
    ("madina.lang@kaznu.kz", "timur.sport@satbayev.university.kz", "Кроссовки Nike", 5, "Как новые, коробка и чеки есть."),
    ("nurlan.biz@narxoz.kz", "sanzhar@iitu.kz", "Рюкзак", 4, "Норм состояние, торг небольшой прошёл."),
    ("sara.med@kaznmu.kz", "madina.lang@kaznu.kz", "Набор уходовой", 5, "Запечатано, спасибо!"),
    ("aisha.design@kbtu.kz", "arman.student@satbayev.university.kz", "Wacom", 5, "Планшет рабочий, стилус пишет сразу."),
    ("timur.sport@satbayev.university.kz", "diana.math@kaznu.kz", "лампа Xiaomi", 4, "Яркость огонь, упаковка чуть помята."),
]


class Command(BaseCommand):
    help = "Добавляет демо-студентов, товары по разделам каталога, отзывы, избранное и чаты"

    def add_arguments(self, parser):
        parser.add_argument("--password", default=DEMO_PASSWORD_DEFAULT, help="Пароль для демо-студентов")
        parser.add_argument("--skip-chats", action="store_true", help="Не создавать чаты/сообщения")

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]
        skip_chats = options["skip_chats"]

        self.stdout.write("Seeding CampusPlace demo data...")

        admin, created_admin = User.objects.get_or_create(
            email="admin@campusplace.kz",
            defaults={
                "full_name": "Администратор Кампуса",
                "university": "CampusPlace",
                "is_verified": True,
                "is_staff": True,
                "is_superuser": True,
                "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
            },
        )
        if created_admin or not admin.has_usable_password():
            admin.set_password("admin123")
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()
            self.stdout.write(self.style.SUCCESS("Admin: admin@campusplace.kz / admin123"))
        else:
            self.stdout.write("Admin already present")

        users_by_email = {}
        created_users = 0
        for spec in STUDENTS:
            user, created = User.objects.get_or_create(
                email=spec["email"],
                defaults={k: v for k, v in spec.items() if k != "email"},
            )
            # refresh profile fields for existing demo accounts
            for key, value in spec.items():
                if key != "email":
                    setattr(user, key, value)
            user.set_password(password)
            user.is_active = True
            user.is_banned = False
            user.save()
            users_by_email[user.email] = user
            if created:
                created_users += 1
        self.stdout.write(f"Students ready: {len(users_by_email)} (new {created_users})")

        created_products = 0
        products_by_title = {}
        for seller_email, title, category, price, condition, location, views, status, images, description in PRODUCTS:
            seller = users_by_email[seller_email]
            product, created = Product.objects.get_or_create(
                title=title,
                seller=seller,
                defaults={
                    "description": description,
                    "price": price,
                    "category": category,
                    "condition": condition,
                    "location": location,
                    "images": images,
                    "views_count": views,
                    "status": status,
                },
            )
            if not created:
                product.description = description
                product.price = price
                product.category = category
                product.condition = condition
                product.location = location
                product.images = images
                product.views_count = max(product.views_count or 0, views)
                product.status = status
                product.save()
            else:
                created_products += 1
            products_by_title[title] = product
        self.stdout.write(f"Products ready: {len(products_by_title)} (new {created_products})")

        created_reviews = 0
        for reviewer_email, seller_email, title_part, rating, comment in REVIEW_SPECS:
            reviewer = users_by_email[reviewer_email]
            seller = users_by_email[seller_email]
            product = next((p for t, p in products_by_title.items() if title_part.lower() in t.lower() and p.seller_id == seller.id), None)
            if not product:
                continue
            _, created = Review.objects.get_or_create(
                product=product,
                reviewer=reviewer,
                defaults={"seller": seller, "rating": rating, "comment": comment},
            )
            if created:
                created_reviews += 1
        self.stdout.write(f"Reviews added: {created_reviews}")

        # Favorites: each student likes 2–3 products not their own
        fav_count = 0
        product_list = list(products_by_title.values())
        for idx, user in enumerate(users_by_email.values()):
            picks = [p for p in product_list if p.seller_id != user.id and p.status == "active"]
            for product in picks[idx % max(len(picks), 1): idx % max(len(picks), 1) + 3]:
                _, created = Favorite.objects.get_or_create(user=user, product=product)
                if created:
                    fav_count += 1
        self.stdout.write(f"Favorites added: {fav_count}")

        if not skip_chats:
            chat_pairs = [
                ("arman.student@satbayev.university.kz", "Высшая математика — том 1–2 + задачник",
                 [("arman.student@satbayev.university.kz", "Привет! Учебник ещё актуален?"),
                  ("diana.math@kaznu.kz", "Да, можем встретиться у библиотеки после 16:00"),
                  ("arman.student@satbayev.university.kz", "Отлично, буду в 16:15")]),
                ("madina.lang@kaznu.kz", "Кроссовки Nike Revolution, 42",
                 [("madina.lang@kaznu.kz", "Можно примерку на кампусе?"),
                  ("timur.sport@satbayev.university.kz", "Да, у спорткомплекса"),
                  ("madina.lang@kaznu.kz", "Договорились!")]),
                ("nurlan.biz@narxoz.kz", "Наушники Sony WH-1000XM4",
                 [("nurlan.biz@narxoz.kz", "Торг уместен?"),
                  ("arman.student@satbayev.university.kz", "Могу скинуть до 60 000 ₸")]),
            ]
            chats_created = 0
            msgs_created = 0
            for buyer_email, product_title, transcript in chat_pairs:
                product = products_by_title[product_title]
                buyer = users_by_email[buyer_email]
                conv, created = Conversation.objects.get_or_create(
                    product=product,
                    buyer=buyer,
                    seller=product.seller,
                    defaults={"deal_status": "active"},
                )
                if created:
                    chats_created += 1
                if conv.messages.count() == 0:
                    for sender_email, text in transcript:
                        Message.objects.create(
                            conversation=conv,
                            sender=users_by_email[sender_email],
                            text=text,
                            is_read=sender_email != buyer_email,
                        )
                        msgs_created += 1
            # one reserved deal chat
            reserved_product = products_by_title.get("Кольцевая лампа 26 см + штатив")
            if reserved_product:
                buyer = users_by_email["diana.math@kaznu.kz"]
                conv, created = Conversation.objects.get_or_create(
                    product=reserved_product,
                    buyer=buyer,
                    seller=reserved_product.seller,
                    defaults={"deal_status": "reserved"},
                )
                if created:
                    chats_created += 1
                    Message.objects.create(
                        conversation=conv,
                        sender=buyer,
                        text="Бронирую до завтра, ок?",
                        is_read=True,
                    )
                    Message.objects.create(
                        conversation=conv,
                        sender=reserved_product.seller,
                        text="Ок, статус reserved поставила",
                        is_read=False,
                    )
                    msgs_created += 2
                else:
                    conv.deal_status = "reserved"
                    conv.save(update_fields=["deal_status"])
            self.stdout.write(f"Chats: +{chats_created}, messages: +{msgs_created}")

        # Sample pending report for staff moderation UI
        sample_product = products_by_title.get("Худи оверсайз чёрное, L")
        if sample_product:
            Report.objects.get_or_create(
                product=sample_product,
                reporter=users_by_email["sara.med@kaznmu.kz"],
                defaults={
                    "reason": "spam",
                    "comment": "Похоже на дубль объявления (демо-жалоба для модерации)",
                    "status": "pending",
                },
            )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Demo seed complete"))
        self.stdout.write(f"Users total: {User.objects.count()}")
        self.stdout.write(f"Products total: {Product.objects.count()} (active {Product.objects.filter(status='active').count()})")
        self.stdout.write(f"Reviews total: {Review.objects.count()}")
        self.stdout.write(f"Favorites total: {Favorite.objects.count()}")
        self.stdout.write(f"Conversations total: {Conversation.objects.count()}")
        self.stdout.write("")
        self.stdout.write("Login examples (password = %s):" % password)
        self.stdout.write("  diana.math@kaznu.kz")
        self.stdout.write("  arman.student@satbayev.university.kz")
        self.stdout.write("  aisha.design@kbtu.kz")
        self.stdout.write("Staff: admin@campusplace.kz / admin123")
