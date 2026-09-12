BEGIN TRANSACTION;
CREATE TABLE inventory (
	id INTEGER NOT NULL, 
	part_name VARCHAR(500) NOT NULL, 
	car_model VARCHAR(100) NOT NULL, 
	generation_type VARCHAR(100) NOT NULL, 
	part_category VARCHAR(50) NOT NULL, 
	position VARCHAR(20) NOT NULL, 
	side VARCHAR(20) NOT NULL, 
	quality_tier VARCHAR(50) NOT NULL, 
	oem_number VARCHAR(100) NOT NULL, 
	selling_price NUMERIC(12, 2) NOT NULL, 
	stock INTEGER NOT NULL, 
	low_stock_threshold INTEGER NOT NULL, 
	compatible_models JSON NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "inventory" VALUES(1,'Swift Type 3 Headlight Assembly LH','Swift','Type 3 (2018-2021)','Headlights','Front','LH','MGP Genuine','35120-M78J10',4250,4,3,'["Dzire Type 3"]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(2,'Swift Type 3 Headlight Assembly RH','Swift','Type 3 (2018-2021)','Headlights','Front','RH','MGP Genuine','35110-M78J10',4250,3,3,'["Dzire Type 3"]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(3,'Swift Type 3 Tail Light LH','Swift','Type 3 (2018-2021)','Backlights','Back','LH','MGP Genuine','36510-M78J20',2950,2,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(4,'Swift Type 3 Tail Light RH','Swift','Type 3 (2018-2021)','Backlights','Back','RH','MGP Genuine','36520-M78J20',2950,1,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(5,'Swift Type 3 Front Bumper','Swift','Type 3 (2018-2021)','Bumpers','Front','Universal','MGP Genuine','71110-M78J50',6800,2,2,'[]','2026-08-12 13:43:44','2026-08-12 19:51:32');
INSERT INTO "inventory" VALUES(6,'Swift Type 3 Rear Bumper','Swift','Type 3 (2018-2021)','Bumpers','Back','Universal','MGP Genuine','71510-M78J50',5900,2,2,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(7,'Swift Type 3 Headlight LH (Aftermarket)','Swift','Type 3 (2018-2021)','Headlights','Front','LH','Aftermarket','AFT-SW3-HL-LH',2150,8,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(8,'Swift Type 3 Headlight RH (Aftermarket)','Swift','Type 3 (2018-2021)','Headlights','Front','RH','Aftermarket','AFT-SW3-HL-RH',2150,6,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(9,'Swift Type 4 LED Headlight LH','Swift','Type 4 (2022+)','Headlights','Front','LH','MGP Genuine','35120-M95J10',7850,2,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(10,'Swift Type 4 LED Headlight RH','Swift','Type 4 (2022+)','Headlights','Front','RH','MGP Genuine','35110-M95J10',7850,3,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(11,'Swift Type 4 Front Bumper','Swift','Type 4 (2022+)','Bumpers','Front','Universal','MGP Genuine','71110-M95J50',8450,5,2,'[]','2026-08-12 13:43:44','2026-08-13 14:36:36');
INSERT INTO "inventory" VALUES(12,'Dzire Type 3 Headlight LH','Dzire','Type 3 (2017-2020)','Headlights','Front','LH','MGP Genuine','35120-M79J00',4100,8,3,'["Swift Type 3"]','2026-08-12 13:43:44','2026-08-12 22:03:54');
INSERT INTO "inventory" VALUES(13,'Dzire Type 3 Headlight RH','Dzire','Type 3 (2017-2020)','Headlights','Front','RH','MGP Genuine','35110-M79J00',4100,7,3,'["Swift Type 3"]','2026-08-12 13:43:44','2026-08-13 14:33:57');
INSERT INTO "inventory" VALUES(14,'Dzire Type 3 Tail Light LH','Dzire','Type 3 (2017-2020)','Backlights','Back','LH','MGP Genuine','36510-M79J20',2750,4,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(15,'Dzire Type 3 Tail Light RH','Dzire','Type 3 (2017-2020)','Backlights','Back','RH','MGP Genuine','36520-M79J20',2750,3,3,'[]','2026-08-12 13:43:44','2026-08-12 19:48:06');
INSERT INTO "inventory" VALUES(16,'Dzire Type 3 Front Bumper (Aftermarket)','Dzire','Type 3 (2017-2020)','Bumpers','Front','Universal','Aftermarket','AFT-DZ3-FB-01',3200,5,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(17,'Baleno Type 2 LED Headlight LH','Baleno','Type 2 (2022+)','Headlights','Front','LH','MGP Genuine','35120-M80J10',8950,2,2,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(18,'Baleno Type 2 LED Headlight RH','Baleno','Type 2 (2022+)','Headlights','Front','RH','MGP Genuine','35110-M80J10',8950,6,2,'[]','2026-08-12 13:43:44','2026-08-12 19:47:30');
INSERT INTO "inventory" VALUES(19,'Baleno Type 2 Tail Light LH','Baleno','Type 2 (2022+)','Backlights','Back','LH','MGP Genuine','36510-M80J20',3450,3,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(20,'Baleno Type 2 Tail Light RH','Baleno','Type 2 (2022+)','Backlights','Back','RH','MGP Genuine','36520-M80J20',3450,4,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(21,'Baleno Type 2 Front Bumper','Baleno','Type 2 (2022+)','Bumpers','Front','Universal','MGP Genuine','71110-M80J50',7200,5,2,'[]','2026-08-12 13:43:44','2026-08-12 19:42:48');
INSERT INTO "inventory" VALUES(22,'WagonR Type 3 Headlight LH','WagonR','Type 3 (2019+)','Headlights','Front','LH','MGP Genuine','35120-M83J00',3950,2,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(23,'WagonR Type 3 Headlight RH','WagonR','Type 3 (2019+)','Headlights','Front','RH','MGP Genuine','35110-M83J00',3950,1,3,'[]','2026-08-12 13:43:44','2026-08-13 14:45:57');
INSERT INTO "inventory" VALUES(24,'WagonR Type 3 Tail Light LH','WagonR','Type 3 (2019+)','Backlights','Back','LH','Aftermarket','AFT-WR3-TL-LH',1850,7,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(25,'WagonR Type 3 Tail Light RH','WagonR','Type 3 (2019+)','Backlights','Back','RH','Aftermarket','AFT-WR3-TL-RH',1850,5,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(26,'WagonR Type 3 Front Bumper','WagonR','Type 3 (2019+)','Bumpers','Front','Universal','MGP Genuine','71110-M83J50',4900,2,2,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(27,'WagonR Type 3 Rear Bumper (Aftermarket)','WagonR','Type 3 (2019+)','Bumpers','Back','Universal','Aftermarket','AFT-WR3-RB-01',2800,3,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(28,'Super Carry Headlight LH','Super Carry','Type 1 (Commercial)','Headlights','Front','LH','Aftermarket','AFT-SC1-HL-LH',2650,4,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(29,'Super Carry Headlight RH','Super Carry','Type 1 (Commercial)','Headlights','Front','RH','Aftermarket','AFT-SC1-HL-RH',2650,3,3,'[]','2026-08-12 13:43:44','2026-08-12 13:43:44');
INSERT INTO "inventory" VALUES(30,'Super Carry Front Bumper','Super Carry','Type 1 (Commercial)','Bumpers','Front','Universal','Aftermarket','AFT-SC1-FB-01',3450,3,2,'[]','2026-08-12 13:43:44','2026-08-12 19:36:41');
INSERT INTO "inventory" VALUES(31,'Super Carry Tail Light LH','Super Carry','Type 1 (Commercial)','Backlights','Back','LH','MGP Genuine','36510-M77J20',2200,4,3,'[]','2026-08-12 13:43:44','2026-08-12 22:03:07');
CREATE TABLE stock_audit_logs (
	id INTEGER NOT NULL, 
	worker_name VARCHAR(255) NOT NULL, 
	worker_role VARCHAR(50) NOT NULL, 
	part_name VARCHAR(500) NOT NULL, 
	oem_number VARCHAR(100) NOT NULL, 
	car_model VARCHAR(100) NOT NULL, 
	generation_type VARCHAR(100) NOT NULL, 
	action_type VARCHAR(100) NOT NULL, 
	reason TEXT NOT NULL, 
	previous_stock INTEGER, 
	new_stock INTEGER, 
	delta INTEGER, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "stock_audit_logs" VALUES(1,'Nilesh','staff','Super Carry Front Bumper','AFT-SC1-FB-01','Super Carry','Type 1 (Commercial)','stock_increased','Manual Audit Correction',2,3,1,'2026-08-12 19:36:41');
INSERT INTO "stock_audit_logs" VALUES(2,'Nilesh','staff','Super Carry Tail Light LH','36510-M77J20','Super Carry','Type 1 (Commercial)','stock_increased','Stock Received',0,1,1,'2026-08-12 19:37:11');
INSERT INTO "stock_audit_logs" VALUES(3,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',1,2,1,'2026-08-12 19:42:43');
INSERT INTO "stock_audit_logs" VALUES(4,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',2,3,1,'2026-08-12 19:42:44');
INSERT INTO "stock_audit_logs" VALUES(5,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',3,4,1,'2026-08-12 19:42:44');
INSERT INTO "stock_audit_logs" VALUES(6,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_decreased','Stock Reduction',4,3,-1,'2026-08-12 19:42:45');
INSERT INTO "stock_audit_logs" VALUES(7,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_decreased','Stock Reduction',3,2,-1,'2026-08-12 19:42:45');
INSERT INTO "stock_audit_logs" VALUES(8,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_decreased','Stock Reduction',2,1,-1,'2026-08-12 19:42:45');
INSERT INTO "stock_audit_logs" VALUES(9,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_decreased','Stock Reduction',1,0,-1,'2026-08-12 19:42:45');
INSERT INTO "stock_audit_logs" VALUES(10,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',0,1,1,'2026-08-12 19:42:47');
INSERT INTO "stock_audit_logs" VALUES(11,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',1,2,1,'2026-08-12 19:42:47');
INSERT INTO "stock_audit_logs" VALUES(12,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',2,3,1,'2026-08-12 19:42:47');
INSERT INTO "stock_audit_logs" VALUES(13,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',3,4,1,'2026-08-12 19:42:47');
INSERT INTO "stock_audit_logs" VALUES(14,'Nilesh','staff','Baleno Type 2 Front Bumper','71110-M80J50','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',4,5,1,'2026-08-12 19:42:48');
INSERT INTO "stock_audit_logs" VALUES(15,'Nilesh','staff','Baleno Type 2 LED Headlight RH','35110-M80J10','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',1,2,1,'2026-08-12 19:47:29');
INSERT INTO "stock_audit_logs" VALUES(16,'Nilesh','staff','Baleno Type 2 LED Headlight RH','35110-M80J10','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',2,3,1,'2026-08-12 19:47:29');
INSERT INTO "stock_audit_logs" VALUES(17,'Nilesh','staff','Baleno Type 2 LED Headlight RH','35110-M80J10','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',3,4,1,'2026-08-12 19:47:30');
INSERT INTO "stock_audit_logs" VALUES(18,'Nilesh','staff','Baleno Type 2 LED Headlight RH','35110-M80J10','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',4,5,1,'2026-08-12 19:47:30');
INSERT INTO "stock_audit_logs" VALUES(19,'Nilesh','staff','Baleno Type 2 LED Headlight RH','35110-M80J10','Baleno','Type 2 (2022+)','stock_increased','Stock Addition',5,6,1,'2026-08-12 19:47:30');
INSERT INTO "stock_audit_logs" VALUES(20,'Nilesh','staff','Dzire Type 3 Tail Light RH','36520-M79J20','Dzire','Type 3 (2017-2020)','stock_increased','Stock Addition',0,1,1,'2026-08-12 19:48:05');
INSERT INTO "stock_audit_logs" VALUES(21,'Nilesh','staff','Dzire Type 3 Tail Light RH','36520-M79J20','Dzire','Type 3 (2017-2020)','stock_increased','Stock Addition',1,2,1,'2026-08-12 19:48:06');
INSERT INTO "stock_audit_logs" VALUES(22,'Nilesh','staff','Dzire Type 3 Tail Light RH','36520-M79J20','Dzire','Type 3 (2017-2020)','stock_increased','Stock Addition',2,3,1,'2026-08-12 19:48:06');
INSERT INTO "stock_audit_logs" VALUES(23,'Nilesh','staff','Swift Type 3 Front Bumper','71110-M78J50','Swift','Type 3 (2018-2021)','stock_increased','Added 6 units',1,7,6,'2026-08-12 19:50:56');
INSERT INTO "stock_audit_logs" VALUES(24,'Nilesh','staff','Swift Type 3 Front Bumper','71110-M78J50','Swift','Type 3 (2018-2021)','stock_decreased','Dropped 5 units',7,2,-5,'2026-08-12 19:51:32');
INSERT INTO "stock_audit_logs" VALUES(25,'Nilesh','staff','Super Carry Tail Light LH','36510-M77J20','Super Carry','Type 1 (Commercial)','stock_increased','Added 3 units',1,4,3,'2026-08-12 22:03:07.567812');
INSERT INTO "stock_audit_logs" VALUES(26,'Nilesh','owner','Dzire Type 3 Headlight LH','35120-M79J00','Dzire','Type 3 (2017-2020)','stock_increased','Added 5 units',3,8,5,'2026-08-12 22:03:54.406034');
INSERT INTO "stock_audit_logs" VALUES(27,'Nilesh','owner','Dzire Type 3 Headlight RH','35110-M79J00','Dzire','Type 3 (2017-2020)','stock_increased','Added 5 units',2,7,5,'2026-08-13 14:33:57.832899');
INSERT INTO "stock_audit_logs" VALUES(28,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_increased','Added 1 unit',1,2,1,'2026-08-13 14:35:47.581869');
INSERT INTO "stock_audit_logs" VALUES(29,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_increased','Added 1 unit',2,3,1,'2026-08-13 14:35:48.814054');
INSERT INTO "stock_audit_logs" VALUES(30,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_increased','Added 1 unit',3,4,1,'2026-08-13 14:35:49.313670');
INSERT INTO "stock_audit_logs" VALUES(31,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_increased','Added 1 unit',4,5,1,'2026-08-13 14:35:50.147262');
INSERT INTO "stock_audit_logs" VALUES(32,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_decreased','Dropped 1 unit',5,4,-1,'2026-08-13 14:35:50.851522');
INSERT INTO "stock_audit_logs" VALUES(33,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_decreased','Dropped 1 unit',4,3,-1,'2026-08-13 14:35:51.047714');
INSERT INTO "stock_audit_logs" VALUES(34,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_decreased','Dropped 1 unit',3,2,-1,'2026-08-13 14:35:51.214329');
INSERT INTO "stock_audit_logs" VALUES(35,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_increased','Added 1 unit',2,3,1,'2026-08-13 14:36:36.101741');
INSERT INTO "stock_audit_logs" VALUES(36,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_increased','Added 1 unit',3,4,1,'2026-08-13 14:36:36.463995');
INSERT INTO "stock_audit_logs" VALUES(37,'Nilesh','owner','Swift Type 4 Front Bumper','71110-M95J50','Swift','Type 4 (2022+)','stock_increased','Added 1 unit',4,5,1,'2026-08-13 14:36:36.630373');
INSERT INTO "stock_audit_logs" VALUES(38,'Nilesh','owner','WagonR Type 3 Headlight RH','35110-M83J00','WagonR','Type 3 (2019+)','stock_increased','Added 1 unit directly',1,2,1,'2026-08-13 14:42:03.445535');
INSERT INTO "stock_audit_logs" VALUES(39,'Nilesh','owner','WagonR Type 3 Headlight RH','35110-M83J00','WagonR','Type 3 (2019+)','stock_increased','Added 1 unit directly',2,3,1,'2026-08-13 14:42:04.043209');
INSERT INTO "stock_audit_logs" VALUES(40,'Nilesh','owner','WagonR Type 3 Headlight RH','35110-M83J00','WagonR','Type 3 (2019+)','stock_decreased','Dropped 1 unit directly',3,2,-1,'2026-08-13 14:42:04.830593');
INSERT INTO "stock_audit_logs" VALUES(41,'Nilesh','owner','WagonR Type 3 Headlight RH','35110-M83J00','WagonR','Type 3 (2019+)','stock_decreased','Dropped 1 unit directly',2,1,-1,'2026-08-13 14:42:04.977106');
INSERT INTO "stock_audit_logs" VALUES(42,'Nilesh','owner','WagonR Type 3 Headlight RH','35110-M83J00','WagonR','Type 3 (2019+)','stock_increased','Added 5 units directly',1,6,5,'2026-08-13 14:45:47.787847');
INSERT INTO "stock_audit_logs" VALUES(43,'Nilesh','owner','WagonR Type 3 Headlight RH','35110-M83J00','WagonR','Type 3 (2019+)','stock_decreased','Dropped 5 units directly',6,1,-5,'2026-08-13 14:45:57.836542');
CREATE TABLE user_roles (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	role VARCHAR(5) NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "user_roles" VALUES(1,1,'owner','2026-08-12 13:54:09');
INSERT INTO "user_roles" VALUES(2,2,'owner','2026-08-12 13:55:03');
INSERT INTO "user_roles" VALUES(3,3,'staff','2026-08-12 13:56:37');
INSERT INTO "user_roles" VALUES(4,4,'staff','2026-08-12 21:57:01');
CREATE TABLE users (
	id INTEGER NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES(1,'admin@maruti.com','$2b$12$T6oYpjX0QigS2FwxlhQjkOc1w7rt3hQNLfxmYLrFzCUU7aUQ8sC4G','2026-08-12 13:54:09');
INSERT INTO "users" VALUES(2,'nileshagarwal2907@gmail.com','$2b$12$2ZF5uabtP7z9k8NZeottMumZfaUBeU3oFjmxkkMlRWzCVF6n.tsX.','2026-08-12 13:55:03');
INSERT INTO "users" VALUES(3,'Partharora297@gmail.com','$2b$12$j8b6pB1sdf5mLsFONpu8s.mQ6R2ECGdoocYdEzjD/NVPJAHMBLzBq','2026-08-12 13:56:37');
INSERT INTO "users" VALUES(4,'nileshagarwal0729@gmail.com','$2b$12$SHzUd6pd4kOwWVmS7HNRmOYjZwa/6Z6R7fU37maJm/HV4FqOet2iG','2026-08-12 21:57:01');
CREATE TABLE workers (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	role VARCHAR(5) NOT NULL, 
	created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
INSERT INTO "workers" VALUES(1,1,'Admin User','owner','2026-08-12 13:54:09');
INSERT INTO "workers" VALUES(2,2,'Nilesh','owner','2026-08-12 13:55:03');
INSERT INTO "workers" VALUES(3,3,'Parth','staff','2026-08-12 13:56:37');
INSERT INTO "workers" VALUES(4,4,'Nilesh','staff','2026-08-12 21:57:01');
CREATE UNIQUE INDEX ix_users_email ON users (email);
COMMIT;
