import fs from 'fs';

async function generateMySQLInserts() {
  try {
    const exportData = JSON.parse(fs.readFileSync('./postgresql-export.json', 'utf8'));
    let sqlStatements = [];
    
    sqlStatements.push('-- StapuBox Data Import');
    sqlStatements.push('USE stapubox_replit;');
    sqlStatements.push('');
    
    // Import users
    sqlStatements.push('-- Import users');
    for (const user of exportData.users) {
      const createdAt = user.created_at ? new Date(user.created_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = user.updated_at ? new Date(user.updated_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sql = `INSERT INTO users (id, phone_number, name, user_type, date_of_birth, age, workplace, bio, profile_photo_url, city, society_area, email, location_coordinates, location_name, is_active, created_at, updated_at) VALUES (${user.id}, '${user.phone_number}', '${user.name.replace(/'/g, "''")}', '${user.user_type}', ${user.date_of_birth ? `'${user.date_of_birth}'` : 'NULL'}, ${user.age}, ${user.workplace ? `'${user.workplace.replace(/'/g, "''")}'` : 'NULL'}, ${user.bio ? `'${user.bio.replace(/'/g, "''")}'` : 'NULL'}, ${user.profile_photo_url ? `'${user.profile_photo_url}'` : 'NULL'}, ${user.city ? `'${user.city.replace(/'/g, "''")}'` : 'NULL'}, ${user.society_area ? `'${user.society_area.replace(/'/g, "''")}'` : 'NULL'}, ${user.email ? `'${user.email}'` : 'NULL'}, ${user.location_coordinates ? `'${user.location_coordinates}'` : 'NULL'}, ${user.location_name ? `'${user.location_name.replace(/'/g, "''")}'` : 'NULL'}, ${user.is_active}, '${createdAt}', '${updatedAt}') ON DUPLICATE KEY UPDATE name = VALUES(name);`;
      sqlStatements.push(sql);
    }
    
    sqlStatements.push('');
    sqlStatements.push('-- Import user activities');
    for (const activity of exportData.user_activities) {
      const createdAt = activity.created_at ? new Date(activity.created_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sql = `INSERT INTO user_activities (id, user_id, activity_name, skill_level, is_primary, coaching_experience_years, certifications, created_at) VALUES (${activity.id}, ${activity.user_id}, '${activity.activity_name.replace(/'/g, "''")}', '${activity.skill_level}', ${activity.is_primary || false}, ${activity.coaching_experience_years || 'NULL'}, ${activity.certifications ? `'${activity.certifications.replace(/'/g, "''")}'` : 'NULL'}, '${createdAt}') ON DUPLICATE KEY UPDATE skill_level = VALUES(skill_level);`;
      sqlStatements.push(sql);
    }
    
    sqlStatements.push('');
    sqlStatements.push('-- Import interests');
    for (const interest of exportData.interests) {
      const sentAt = interest.sent_at ? new Date(interest.sent_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const respondedAt = interest.responded_at ? `'${new Date(interest.responded_at).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';
      const sql = `INSERT INTO interests (id, sender_id, receiver_id, status, sent_at, responded_at) VALUES (${interest.id}, ${interest.sender_id}, ${interest.receiver_id}, '${interest.status}', '${sentAt}', ${respondedAt}) ON DUPLICATE KEY UPDATE status = VALUES(status);`;
      sqlStatements.push(sql);
    }
    
    sqlStatements.push('');
    sqlStatements.push('-- Import career applications');
    for (const app of exportData.career_applications) {
      const submittedAt = app.submitted_at ? new Date(app.submitted_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sql = `INSERT INTO career_applications (id, name, email, phone, contribution_area, resume_url, submitted_at) VALUES (${app.id}, '${app.name.replace(/'/g, "''")}', '${app.email}', '${app.phone}', '${app.contribution_area.replace(/'/g, "''")}', ${app.resume_url ? `'${app.resume_url}'` : 'NULL'}, '${submittedAt}') ON DUPLICATE KEY UPDATE name = VALUES(name);`;
      sqlStatements.push(sql);
    }
    
    sqlStatements.push('');
    sqlStatements.push('-- Import investor inquiries');
    for (const inquiry of exportData.investor_inquiries) {
      const submittedAt = inquiry.submitted_at ? new Date(inquiry.submitted_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sql = `INSERT INTO investor_inquiries (id, name, phone, business_email, submitted_at) VALUES (${inquiry.id}, '${inquiry.name.replace(/'/g, "''")}', '${inquiry.phone}', '${inquiry.business_email}', '${submittedAt}') ON DUPLICATE KEY UPDATE name = VALUES(name);`;
      sqlStatements.push(sql);
    }
    
    sqlStatements.push('');
    sqlStatements.push('-- Import sessions');
    for (const session of exportData.sessions) {
      const expiresAt = session.expires_at ? new Date(session.expires_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const createdAt = session.created_at ? new Date(session.created_at).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const sql = `INSERT INTO sessions (id, phone_number, session_token, session_type, expires_at, user_id, created_at) VALUES (${session.id}, '${session.phone_number}', '${session.session_token}', '${session.session_type}', '${expiresAt}', ${session.user_id || 'NULL'}, '${createdAt}') ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);`;
      sqlStatements.push(sql);
    }
    
    sqlStatements.push('');
    sqlStatements.push('-- Verify import');
    sqlStatements.push('SELECT COUNT(*) as total_users FROM users;');
    sqlStatements.push('SELECT COUNT(*) as total_activities FROM user_activities;');
    sqlStatements.push('SELECT COUNT(*) as total_interests FROM interests;');
    sqlStatements.push('SELECT COUNT(*) as total_career_apps FROM career_applications;');
    sqlStatements.push('SELECT COUNT(*) as total_investor_inquiries FROM investor_inquiries;');
    sqlStatements.push('SELECT COUNT(*) as total_sessions FROM sessions;');
    
    fs.writeFileSync('./import-data.sql', sqlStatements.join('\n'));
    
    console.log('✅ MySQL import statements generated successfully');
    console.log(`📊 Generated ${sqlStatements.length} SQL statements`);
    console.log(`📈 Ready to import ${exportData.total_records} records`);
    console.log('📝 Run: mysql -h 147.93.107.184 -u replit-app -p stapubox_replit < import-data.sql');
    
  } catch (error) {
    console.error('❌ Failed to generate SQL:', error.message);
  }
}

generateMySQLInserts();