INSERT INTO cats (name, owner_id) VALUES ('scar', 
(SELECT id FROM owners WHERE name='Jim'));

