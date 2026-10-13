const db = require('./database');
const bcrypt = require('bcryptjs');

function seed() {
  const defaultPassword = bcrypt.hashSync('kinoverse123', 10);

  // Ensure root administrator exists
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, username, name, avatar, role, password)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'admin_root',
    'admin@kinoverse.uz',
    'admin',
    'Bosh Administrator',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'super_admin',
    defaultPassword
  );

  console.log('✅ Admin hisobi tekshirildi (Demo ma’lumotlarsiz toza holatda).');
}

seed();

module.exports = seed;
