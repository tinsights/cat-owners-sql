CREATE TABLE IF NOT EXISTS owners (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE IF NOT EXISTS cats (id SERIAL PRIMARY KEY, name TEXT, owner_id INTEGER);

SELECT owner_id from cats GROUP BY owner_id HAVING COUNT(owner_id) > 1;

SELECT owner_id FROM cats WHERE name='Muji';