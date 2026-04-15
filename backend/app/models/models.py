.\.venv\Scripts\activatecd "c:\Users\Sujan Kalgude\OneDrive\Desktop\AI\smart-film-platform\backend"from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Table, Column  # Added Column import


class Base(DeclarativeBase):
    pass


user_movie_favorites = Table(
    "user_movie_favorites",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),   # Fixed
    Column("movie_id", Integer, ForeignKey("movies.id"), primary_key=True), # Fixed
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    overview: Mapped[str | None]
    genres: Mapped[str | None]

