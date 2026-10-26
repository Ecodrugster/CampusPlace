"""
Legacy entrypoint. Prefer:

  python manage.py seed_demo
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.management import call_command


if __name__ == "__main__":
    call_command("seed_demo")
