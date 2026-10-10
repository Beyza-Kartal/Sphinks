# Sahip: A (Beyza)
# Görev: veritabanı bağlantısı (SQLite + SQLModel engine, session)
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///hazirmisin.db"
engine = create_engine(DATABASE_URL, echo=True)


# models.py'deki tablo tanimlarini okuyup hazirmisin.db dosyasinda gercekten olusturur
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# her API istegi icin bir veritabani oturumu acar, istek bitince otomatik kapatir
def get_session():
    with Session(engine) as session:
        yield session