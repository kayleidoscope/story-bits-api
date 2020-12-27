CREATE TABLE story_bits_stories (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id INTEGER REFERENCES story_bits_users(id),
    title TEXT NOT NULL,
    description TEXT
);