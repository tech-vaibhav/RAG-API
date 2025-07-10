# database.py
from databases import Database
from sqlalchemy import create_engine, MetaData

DATABASE_URL = "postgresql://server:pass@localhost:5432/db_name"

database = Database(DATABASE_URL)
engine = create_engine(DATABASE_URL)
metadata = MetaData()
