CREATE TABLE residences (
    character_id INTEGER REFERENCES characters(id),
    setting_id INTEGER REFERENCES settings(id),
    PRIMARY KEY (character_id, setting_id)
)