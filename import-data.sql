-- StapuBox Data Import
USE stapubox_replit;

-- Import users
INSERT INTO users (id, phone_number, name, user_type, date_of_birth, age, workplace, bio, profile_photo_url, city, society_area, email, location_coordinates, location_name, is_active, created_at, updated_at) VALUES (4, '9643673900', 'Navin Kumar', 'player', '1987-09-29', 37, 'Infoedge', NULL, NULL, 'Noida, UP', 'CGEWHO Kendriya Vihar', NULL, NULL, 'Noida, UP', true, '2025-06-30 11:25:11', '2025-06-30 11:25:11') ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO users (id, phone_number, name, user_type, date_of_birth, age, workplace, bio, profile_photo_url, city, society_area, email, location_coordinates, location_name, is_active, created_at, updated_at) VALUES (5, '8406863855', 'Muskan Agrawal', 'player', '1999-09-02', 25, 'StapuBox', NULL, NULL, 'Delhi, DL', 'Saket', NULL, '28.7040592,77.10249019999999', 'Saket, New Delhi, Delhi 110017, India', true, '2025-06-30 12:34:16', '2025-06-30 12:34:16') ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO users (id, phone_number, name, user_type, date_of_birth, age, workplace, bio, profile_photo_url, city, society_area, email, location_coordinates, location_name, is_active, created_at, updated_at) VALUES (6, '9289302236', 'Shubham Raj', 'coach', '1992-07-23', 32, 'Infoedge', NULL, NULL, 'Noida', 'Paras Tierea', NULL, '28.500195723832768,77.41501999484808', 'Paras Tierea, Sector 137, Noida, Uttar Pradesh 201305, India', true, '2025-06-30 13:45:53', '2025-06-30 13:45:53') ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO users (id, phone_number, name, user_type, date_of_birth, age, workplace, bio, profile_photo_url, city, society_area, email, location_coordinates, location_name, is_active, created_at, updated_at) VALUES (10, '9711239143', 'Ankitesh Kushwaha', 'player', '1991-08-31', 33, 'Stapubox', 'I am batmat', NULL, 'Rangareddy, TS', 'Aparna Cyberlife', 'ankiteshiiita@gmail.com', '17.1999602,78.5505481', '23, Kanchi Gachibowli Rd, near Citizens Hospital, Nallagandla, Telangana 500019, India', true, '2025-07-01 11:36:07', '2025-07-01 11:36:07') ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO users (id, phone_number, name, user_type, date_of_birth, age, workplace, bio, profile_photo_url, city, society_area, email, location_coordinates, location_name, is_active, created_at, updated_at) VALUES (11, '9910880270', 'Abhishek', 'player', '1983-06-20', 42, 'Fluence', NULL, NULL, 'Gurugram, HR', 'Godrej Aria', NULL, '28.4594965,77.0266383', 'Godrej Aria, Sector 79, Gurugram, Haryana 122051, India', true, '2025-07-01 17:23:45', '2025-07-01 17:23:45') ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Import user activities
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (11, 4, 'Cricket', 'intermediate', false, NULL, NULL, '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (12, 4, 'Badminton', 'advanced', true, NULL, NULL, '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (13, 5, 'Gym', 'intermediate', true, NULL, NULL, '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (14, 5, 'Running', 'learner', false, NULL, NULL, '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (15, 6, 'Gym', 'intermediate', true, 2, 'A+', '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (16, 10, 'Badminton', 'intermediate', true, NULL, NULL, '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (17, 10, 'Gym', 'intermediate', true, NULL, NULL, '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);
INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (18, 11, 'Cricket', 'advanced', true, NULL, NULL, '2025-07-01 23:11:11') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);

-- Import interests
INSERT INTO interests (id, sender_id, receiver_id, status, sent_at, responded_at) VALUES (3, 4, 6, 'accepted', '2025-06-30 13:50:00', '2025-06-30 13:55:00') ON DUPLICATE KEY UPDATE status = VALUES(status);
INSERT INTO interests (id, sender_id, receiver_id, status, sent_at, responded_at) VALUES (4, 10, 5, 'pending', '2025-07-01 11:36:51', NULL) ON DUPLICATE KEY UPDATE status = VALUES(status);
INSERT INTO interests (id, sender_id, receiver_id, status, sent_at, responded_at) VALUES (5, 10, 4, 'pending', '2025-07-01 11:36:53', NULL) ON DUPLICATE KEY UPDATE status = VALUES(status);
INSERT INTO interests (id, sender_id, receiver_id, status, sent_at, responded_at) VALUES (6, 10, 6, 'pending', '2025-07-01 11:36:57', NULL) ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Import career applications
INSERT INTO career_applications (id, name, email, phone, contribution_area, resume_url, submitted_at) VALUES (1, 'Ankitesh Kushwaha', 'ankiteshiiita@gmail.com', '09711239143', 'Design & UX', 'https.://bbsnhdnsnnnx.com', '2025-07-01 12:35:14') ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Import investor inquiries
INSERT INTO investor_inquiries (id, name, phone, business_email, submitted_at) VALUES (1, 'Testing', '09711239143', 'testing@gm.com', '2025-07-01 12:34:29') ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Import sessions
INSERT INTO sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at) VALUES (1, '9711239143', '972d25163f48c4b0223063ec9fa0e0c3a14c933bb677f82de4b0c00d43900230', 'otp_verified', '2025-07-02 11:34:33', NULL, '2025-07-01 11:34:33') ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);
INSERT INTO sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at) VALUES (3, '9711239143', '5a01b46d9cc76b568401b3ceef096285481838f253f886abb00546bc7ecc9e8c', 'profile_complete', '2025-07-02 11:36:07', 10, '2025-07-01 11:36:07') ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);
INSERT INTO sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at) VALUES (4, '9711239143', '9fba1809293f509ede084022e81e236019b4edd2246679c6ae3193205eab3d28', 'profile_complete', '2025-07-02 11:36:39', 10, '2025-07-01 11:36:39') ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);
INSERT INTO sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at) VALUES (5, '9711239143', '0ff31d5e198e769f89dede4f472ed893fadcf6bfdeed6e6ae10a04ecca4008d1', 'profile_complete', '2025-07-02 12:06:53', 10, '2025-07-01 12:06:53') ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);
INSERT INTO sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at) VALUES (7, '9910880270', '8de565149028992b386123b43d191deaae076c4877ed4f7cbc4249b7471b92e4', 'profile_complete', '2025-07-02 17:23:45', 11, '2025-07-01 17:23:45') ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);
INSERT INTO sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at) VALUES (8, '9910880270', 'fcca7ff00573f0e7f1433f95b26281ca06512c32bdcd31d8cde07afda38a954a', 'profile_complete', '2025-07-02 17:24:38', 11, '2025-07-01 17:24:38') ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);

-- Verify import
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_activities FROM user_activities;
SELECT COUNT(*) as total_interests FROM interests;
SELECT COUNT(*) as total_career_apps FROM career_applications;
SELECT COUNT(*) as total_investor_inquiries FROM investor_inquiries;
SELECT COUNT(*) as total_sessions FROM sessions;