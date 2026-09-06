import pool from './src/config/db.js';
import { detailedModuleContent } from './src/seed/moduleContent.js';

async function updateAllModules() {
  console.log('🔄 Updating all course modules with comprehensive educational content...');

  const mapping = [
    { level: 'beginner', seq: 1, content: detailedModuleContent['m1_1'] },
    { level: 'beginner', seq: 2, content: detailedModuleContent['m1_2'] },
    { level: 'beginner', seq: 3, content: detailedModuleContent['m1_3'] },
    { level: 'intermediate', seq: 1, content: detailedModuleContent['m2_1'] },
    { level: 'intermediate', seq: 2, content: detailedModuleContent['m2_2'] },
    { level: 'intermediate', seq: 3, content: detailedModuleContent['m2_3'] },
    { level: 'advanced', seq: 1, content: detailedModuleContent['m3_1'] },
    { level: 'advanced', seq: 2, content: detailedModuleContent['m3_2'] },
    { level: 'advanced', seq: 3, content: detailedModuleContent['m3_3'] },
  ];

  for (const item of mapping) {
    const res = await pool.query(
      `UPDATE modules
       SET content_body = $1
       WHERE level = $2 AND sequence_order = $3`,
      [item.content, item.level, item.seq]
    );
    console.log(`✅ Updated module [${item.level} #${item.seq}]`);
  }

  console.log('✨ All modules successfully updated with comprehensive matter!');
}

updateAllModules().catch(console.error);
