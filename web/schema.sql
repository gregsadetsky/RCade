CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    visibility TEXT NOT NULL,
    version TEXT NOT NULL,
);

CREATE TABLE game_authors (
    game_id INTEGER NOT NULL,
    recurse_id INTEGER,
    display_name TEXT,
    visibility TEXT NOT NULL,

    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);