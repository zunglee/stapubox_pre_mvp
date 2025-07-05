import mysql from 'mysql2/promise';

export async function createMySQLConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '147.93.107.184',
      port: 3306,
      user: 'replit-app',
      password: '#S!t@pubox007!#',
      database: 'stapubox_replit',
      connectTimeout: 60000
    });

    console.log('✅ MySQL Database Connected Successfully');
    console.log(`📍 Host: 147.93.107.184`);
    console.log(`🔌 Port: 3306`);
    console.log(`🗄️  Database: stapubox_replit`);
    
    return connection;
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error);
    throw error;
  }
}

export async function setupMySQLTables(connection: mysql.Connection) {
  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
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
      )
    `);

    // Create user_activities table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        activity_name VARCHAR(255) NOT NULL,
        skill_level ENUM('beginner', 'learner', 'intermediate', 'advanced', 'expert') NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        coaching_experience_years INT,
        certifications TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create interests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS interests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'declined', 'withdrawn') DEFAULT 'pending',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP NULL,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_interest (sender_id, receiver_id)
      )
    `);

    // Create career_applications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS career_applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        contribution_area VARCHAR(255) NOT NULL,
        resume_url VARCHAR(500),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create investor_inquiries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS investor_inquiries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        business_email VARCHAR(255) NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create feed_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feed_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        category VARCHAR(100) NOT NULL,
        image_url VARCHAR(500),
        like_count INT DEFAULT 0,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create feed_likes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS feed_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        feed_item_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (feed_item_id) REFERENCES feed_items(id) ON DELETE CASCADE,
        UNIQUE KEY unique_like (user_id, feed_item_id)
      )
    `);

    // Create sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        phone_number VARCHAR(20) NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        session_type ENUM('otp_verified', 'profile_complete') NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create otp_verifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        phone_number VARCHAR(20) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ MySQL Tables Created Successfully');
    
    // Log activity for app monitoring
    await connection.execute(`
      INSERT INTO feed_items (title, content, excerpt, category, like_count) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE like_count = like_count
    `, [
      'StapuBox App Activity', 
      'Database tables initialized and ready for application data',
      'MySQL database setup completed',
      'system',
      0
    ]);

  } catch (error) {
    console.error('❌ Error creating MySQL tables:', error);
    throw error;
  }
}