import mysql from 'mysql2/promise';
import fs from 'fs';

async function importToMySQL() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection({
      host: '147.93.107.184',
      port: 3306,
      user: 'replit-app',
      password: '#S!t@pubox007!#',
      database: 'stapubox_replit',
      connectTimeout: 60000
    });
    
    console.log('✅ MySQL Connected Successfully');
    
    // Read exported data
    const exportData = JSON.parse(fs.readFileSync('./postgresql-export.json', 'utf8'));
    console.log(`📊 Loading ${exportData.total_records} records for import`);
    
    // Create tables first
    console.log('🏗️  Creating MySQL tables...');
    await createTables(connection);
    
    // Import users first (needed for foreign keys)
    console.log('👥 Importing users...');
    for (const user of exportData.users) {
      await connection.execute(`
        INSERT INTO users (
          id, phone_number, name, user_type, date_of_birth, age, workplace,
          bio, profile_photo_url, city, society_area, email, location_coordinates,
          location_name, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          updated_at = VALUES(updated_at)
      `, [
        user.id, user.phone_number, user.name, user.user_type,
        user.date_of_birth, user.age, user.workplace, user.bio,
        user.profile_photo_url, user.city, user.society_area,
        user.email, user.location_coordinates, user.location_name,
        user.is_active, user.created_at, user.updated_at
      ]);
    }
    console.log(`✅ Imported ${exportData.users.length} users`);
    
    // Import user activities
    console.log('🏃 Importing user activities...');
    for (const activity of exportData.user_activities) {
      await connection.execute(`
        INSERT INTO user_activities (
          id, user_id, activity_name, skill_level, is_primary,
          coaching_experience_years, certifications, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          skill_level = VALUES(skill_level)
      `, [
        activity.id, activity.user_id, activity.activity_name,
        activity.skill_level, activity.is_primary || false,
        activity.coaching_experience_years, activity.certifications,
        activity.created_at
      ]);
    }
    console.log(`✅ Imported ${exportData.user_activities.length} user activities`);
    
    // Import interests
    console.log('💝 Importing interests...');
    for (const interest of exportData.interests) {
      await connection.execute(`
        INSERT INTO interests (
          id, sender_id, receiver_id, status, sent_at, responded_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          responded_at = VALUES(responded_at)
      `, [
        interest.id, interest.sender_id, interest.receiver_id,
        interest.status, interest.sent_at, interest.responded_at
      ]);
    }
    console.log(`✅ Imported ${exportData.interests.length} interests`);
    
    // Import career applications
    console.log('💼 Importing career applications...');
    for (const app of exportData.career_applications) {
      await connection.execute(`
        INSERT INTO career_applications (
          id, name, email, phone, contribution_area, resume_url, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name)
      `, [
        app.id, app.name, app.email, app.phone,
        app.contribution_area, app.resume_url, app.submitted_at
      ]);
    }
    console.log(`✅ Imported ${exportData.career_applications.length} career applications`);
    
    // Import investor inquiries
    console.log('💰 Importing investor inquiries...');
    for (const inquiry of exportData.investor_inquiries) {
      await connection.execute(`
        INSERT INTO investor_inquiries (
          id, name, phone, business_email, submitted_at
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name)
      `, [
        inquiry.id, inquiry.name, inquiry.phone,
        inquiry.business_email, inquiry.submitted_at
      ]);
    }
    console.log(`✅ Imported ${exportData.investor_inquiries.length} investor inquiries`);
    
    // Import active sessions
    console.log('🔐 Importing active sessions...');
    for (const session of exportData.sessions) {
      await connection.execute(`
        INSERT INTO sessions (
          id, phone_number, session_token, session_type, expires_at, user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          expires_at = VALUES(expires_at)
      `, [
        session.id, session.phone_number, session.session_token,
        session.session_type, session.expires_at, session.user_id,
        session.created_at
      ]);
    }
    console.log(`✅ Imported ${exportData.sessions.length} active sessions`);
    
    // Verify import
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [activityCount] = await connection.execute('SELECT COUNT(*) as count FROM user_activities');
    const [interestCount] = await connection.execute('SELECT COUNT(*) as count FROM interests');
    
    console.log('\n🎉 MySQL Import Complete!');
    console.log(`👥 Users: ${userCount[0].count}`);
    console.log(`🏃 Activities: ${activityCount[0].count}`);
    console.log(`💝 Interests: ${interestCount[0].count}`);
    console.log(`📈 Total: ${exportData.total_records} records imported`);
    
  } catch (error) {
    console.error('❌ MySQL Import Failed:', error.message);
    if (error.message.includes('Access denied')) {
      console.log('\n💡 Solution: Contact your MySQL hosting provider to whitelist Replit IP: 34.53.33.139');
      console.log('📝 Alternative IPs to whitelist: 34.53.33.0/24, 34.102.136.180/32, 35.236.21.0/24');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createTables(connection) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      phone_number VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      user_type ENUM('player', 'coach') NOT NULL,
      date_of_birth DATE,
      age INT,
      bio TEXT,
      profile_photo_url VARCHAR(500),
      city VARCHAR(255),
      society_area VARCHAR(255),
      workplace VARCHAR(255),
      email VARCHAR(255),
      location_coordinates VARCHAR(100),
      location_name VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS user_activities (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      activity_name VARCHAR(255) NOT NULL,
      skill_level ENUM('beginner', 'learner', 'intermediate', 'advanced', 'expert') NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      coaching_experience_years INT,
      certifications TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS interests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'declined', 'withdrawn') DEFAULT 'pending',
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      responded_at TIMESTAMP NULL,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_interest (sender_id, receiver_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS career_applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      contribution_area VARCHAR(255) NOT NULL,
      resume_url VARCHAR(500),
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS investor_inquiries (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      business_email VARCHAR(255) NOT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      phone_number VARCHAR(20) NOT NULL,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      session_type ENUM('otp_verified', 'profile_complete') NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      user_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];
  
  for (const tableSQL of tables) {
    await connection.execute(tableSQL);
  }
  
  console.log('✅ MySQL tables created/verified');
}

importToMySQL();