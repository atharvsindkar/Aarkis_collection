export const sendEmail = async ({ to, subject, html, text }) => {
  console.log(`\n📧 [EMAIL DISPATCH (${process.env.EMAIL_PROVIDER || 'mock'})]`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Preview: ${text ? text.slice(0, 120) : 'HTML Template Delivered'}...`);
  console.log(`   Status: Simulated Delivered Successfully ✅\n`);
  return { success: true, messageId: `mock_${Date.now()}` };
};
