DROP TABLE IF EXISTS books;

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(600),
  isbn VARCHAR(50),
  image_url VARCHAR(500),
  description TEXT,
  bookshelf VARCHAR(255)
)