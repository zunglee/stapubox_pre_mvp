import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function exportPostgreSQLData() {
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('📊 Exporting users...');
    const usersResult = await pool.query('SELECT * FROM users ORDER BY id');
    console.log(`✅ Users exported: ${usersResult.rows.length} records`);
    
    console.log('📊 Exporting user_activities...');
    const activitiesResult = await pool.query('SELECT * FROM user_activities ORDER BY id');
    console.log(`✅ User activities exported: ${activitiesResult.rows.length} records`);
    
    console.log('📊 Exporting interests...');
    const interestsResult = await pool.query('SELECT * FROM interests ORDER BY id');
    console.log(`✅ Interests exported: ${interestsResult.rows.length} records`);
    
    console.log('📊 Exporting career_applications...');
    const careerResult = await pool.query('SELECT * FROM career_applications ORDER BY id');
    console.log(`✅ Career applications exported: ${careerResult.rows.length} records`);
    
    console.log('📊 Exporting investor_inquiries...');
    const investorResult = await pool.query('SELECT * FROM investor_inquiries ORDER BY id');
    console.log(`✅ Investor inquiries exported: ${investorResult.rows.length} records`);
    
    console.log('📊 Exporting feed_items...');
    const feedResult = await pool.query('SELECT * FROM feed_items ORDER BY id');
    console.log(`✅ Feed items exported: ${feedResult.rows.length} records`);
    
    console.log('📊 Exporting feed_likes...');
    const likesResult = await pool.query('SELECT * FROM feed_likes ORDER BY id');
    console.log(`✅ Feed likes exported: ${likesResult.rows.length} records`);
    
    console.log('📊 Exporting active sessions...');
    const sessionsResult = await pool.query('SELECT * FROM sessions WHERE expires_at > NOW() ORDER BY id');
    console.log(`✅ Active sessions exported: ${sessionsResult.rows.length} records`);
    
    const exportData = {
      users: usersResult.rows,
      user_activities: activitiesResult.rows,
      interests: interestsResult.rows,
      career_applications: careerResult.rows,
      investor_inquiries: investorResult.rows,
      feed_items: feedResult.rows,
      feed_likes: likesResult.rows,
      sessions: sessionsResult.rows,
      exported_at: new Date().toISOString(),
      total_records: usersResult.rows.length + activitiesResult.rows.length + interestsResult.rows.length + 
                   careerResult.rows.length + investorResult.rows.length + feedResult.rows.length + 
                   likesResult.rows.length + sessionsResult.rows.length
    };
    
    fs.writeFileSync('./postgresql-export.json', JSON.stringify(exportData, null, 2));
    console.log(`🎉 PostgreSQL data exported successfully to postgresql-export.json`);
    console.log(`📈 Total records exported: ${exportData.total_records}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

exportPostgreSQLData();