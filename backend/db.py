# Sahip: A (Beyza)
# Görev: veritabanı bağlantısı (SQLite + SQLModel engine, session)
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///hazirmisin.db"
engine = create_engine(DATABASE_URL, echo=False)


# models.py'deki tablo tanimlarini okuyup hazirmisin.db dosyasinda gercekten olusturur
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _mevcut_db_migrasyonlari()


def _mevcut_db_migrasyonlari():
    # create_all() YENI tablo ekler ama VAR OLAN tabloya yeni kolon eklemez.
    # Canli hazirmisin.db zaten "hoca" tablosuna sahipse, models.py'ye
    # sonradan eklenen "salt" kolonu burada elle eklenir (varsa hata yutulur).
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE hoca ADD COLUMN salt TEXT DEFAULT ''"))
            conn.commit()
        except OperationalError:
            pass  # kolon zaten var


# her API istegi icin bir veritabani oturumu acar, istek bitince otomatik kapatir
def get_session():
    with Session(engine) as session:
        yield session