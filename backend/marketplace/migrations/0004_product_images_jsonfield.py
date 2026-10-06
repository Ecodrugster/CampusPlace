import json

from django.db import migrations, models


def normalize_images_text(apps, schema_editor):
    Product = apps.get_model("marketplace", "Product")
    for product in Product.objects.all():
        raw = product.images
        if raw is None:
            parsed = []
        elif isinstance(raw, list):
            parsed = raw
        elif isinstance(raw, str):
            try:
                parsed = json.loads(raw or "[]")
            except (TypeError, ValueError, json.JSONDecodeError):
                parsed = []
            if not isinstance(parsed, list):
                parsed = []
        else:
            parsed = []
        # Keep as valid JSON text until AlterField runs.
        product.images = json.dumps(parsed)
        product.save(update_fields=["images"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0003_alter_product_status"),
    ]

    operations = [
        migrations.RunPython(normalize_images_text, noop_reverse),
        migrations.AlterField(
            model_name="product",
            name="images",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
