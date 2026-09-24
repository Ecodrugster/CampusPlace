import json
import sqlite3
from django.core.management.base import BaseCommand
from accounts.models import User
from marketplace.models import Product, Favorite


class Command(BaseCommand):
    help = "Импорт данных из старой FastAPI SQLite базы в Django-модели"

    def add_arguments(self, parser):
        parser.add_argument("--source", default="campus_place_old.sqlite3", help="Путь к старой базе (копии!)")

    def handle(self, *args, **options):
        conn = sqlite3.connect(options["source"])
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # --- Users ---
        cur.execute("SELECT * FROM users")
        user_map = {}
        for row in cur.fetchall():
            old_hash = row["hashed_password"]
            # pbkdf2_sha256$salt$hash -> legacy_pbkdf2_sha256$salt$hash
            new_hash = old_hash.replace("pbkdf2_sha256$", "legacy_pbkdf2_sha256$", 1)

            user, created = User.objects.update_or_create(
                id=row["id"],
                defaults=dict(
                    email=row["email"],
                    password=new_hash,
                    full_name=row["full_name"],
                    university=row["university"] or "",
                    faculty=row["faculty"] or "",
                    dormitory=row["dormitory"] or "",
                    phone=row["phone"] or "",
                    telegram=row["telegram"] or "",
                    avatar_url=row["avatar_url"] or "",
                    is_verified=bool(row["is_verified"]),
                ),
            )
            user_map[row["id"]] = user
            self.stdout.write(f"Пользователь импортирован: {user.email}")

        # --- Products ---
        cur.execute("SELECT * FROM products")
        for row in cur.fetchall():
            Product.objects.update_or_create(
                id=row["id"],
                defaults=dict(
                    title=row["title"],
                    description=row["description"],
                    price=row["price"],
                    category=row["category"],
                    condition=row["condition"] or "Отличное",
                    location=row["location"] or "Главный кампус",
                    images=row["images"] or "[]",
                    status=row["status"] or "active",
                    views_count=row["views_count"] or 0,
                    seller_id=row["seller_id"],
                ),
            )
        self.stdout.write("Товары импортированы")

        # --- Favorites ---
        cur.execute("SELECT * FROM favorites")
        for row in cur.fetchall():
            Favorite.objects.update_or_create(
                id=row["id"],
                defaults=dict(user_id=row["user_id"], product_id=row["product_id"]),
            )
        self.stdout.write("Избранное импортировано")

        conn.close()
        self.stdout.write(self.style.SUCCESS("Импорт завершён"))