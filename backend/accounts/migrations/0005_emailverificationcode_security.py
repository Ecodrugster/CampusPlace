from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0004_emailverificationcode")]
    operations = [
        migrations.AlterField(model_name="emailverificationcode", name="code", field=models.CharField(max_length=128)),
        migrations.AddField(model_name="emailverificationcode", name="attempts", field=models.PositiveSmallIntegerField(default=0)),
    ]
