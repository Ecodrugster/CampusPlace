import hashlib
from django.contrib.auth.hashers import BasePasswordHasher, mask_hash
from django.utils.crypto import constant_time_compare


class LegacyPBKDF2Hasher(BasePasswordHasher):
    """
    Понимает старый формат: pbkdf2_sha256$salt$hash (3 части, 100000 итераций, sha256)
    Используется только для ПРОВЕРКИ старых паролей.
    """
    algorithm = "legacy_pbkdf2_sha256"
    iterations = 100000

    def encode(self, password, salt=None):
        # На случай форс-переустановки — обычно не используется для создания новых
        salt = salt or self.salt()
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), self.iterations)
        return f"{self.algorithm}${salt}${key.hex()}"

    def verify(self, password, encoded):
        algorithm, salt, hash_hex = encoded.split("$", 2)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), self.iterations)
        return constant_time_compare(key.hex(), hash_hex)

    def safe_summary(self, encoded):
        algorithm, salt, hash_hex = encoded.split("$", 2)
        return {
            "algorithm": algorithm,
            "salt": mask_hash(salt),
            "hash": mask_hash(hash_hex),
        }

    def must_update(self, encoded):
        return True  # заставит Django переsохранить пароль в новом формате после успешного логина

    def harden_runtime(self, password, encoded):
        pass