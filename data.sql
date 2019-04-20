INSERT INTO User (name, avatar) VALUES('Norah', 'av1');
INSERT INTO User (name, avatar) VALUES('Josiah', 'av2');
INSERT INTO User (name, avatar) VALUES('Laila', 'av3');
INSERT INTO User (name, avatar) VALUES('Olive', 'av4');

INSERT INTO Node (text, user_id) VALUES('Who lives in a pineapple under the sea?', 1);
INSERT INTO Node (text, user_id) VALUES('Spongebob Squarepants', 2);
INSERT INTO Node (text, user_id) VALUES('Bill Pullman', 2);
INSERT INTO Junction (node_id, child_node_id) VALUES(1, 2);
INSERT INTO Junction (node_id, child_node_id) VALUES(1, 3);
