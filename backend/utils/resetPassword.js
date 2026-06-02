const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

async function resetPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('❌ Please provide both email and new password.');
    console.log('Usage: node utils/resetPassword.js <email> <newPassword>');
    process.exit(1);
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }

    // Hash the new password
    console.log('⏳ Hashing new password...');
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update the database
    console.log('⏳ Updating database...');
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash },
    });

    console.log(`\n✅ Success! Password for user "${user.name}" (${email}) has been reset successfully.`);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Read arguments from command line
const args = process.argv.slice(2);
const email = args[0];
const newPassword = args[1];

resetPassword(email, newPassword);
