import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_mock') || apiKey.length < 10) {
    return null;
  }
  return new Resend(apiKey);
};

const SENDER_EMAIL = process.env.MAIL_FROM || 'Aarkis Atelier <concierge@aarkiscollection.com>';

/**
 * Sends transactional email via Resend when API key is provided,
 * or gracefully logs to server console in local development/mock mode.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const maskedTo = to ? to.replace(/(?<=.{2}).(?=.*@)/g, '*') : '[REDACTED]';
  const resend = getResendClient();

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [to],
        subject: subject || 'Aarkis Collection Security Transmission',
        html: html || `<p>${text}</p>`,
        text: text,
      });

      if (error) {
        console.error(`❌ [RESEND ERROR] Failed to send email to ${maskedTo}:`, error.message);
        return { success: false, error: error.message };
      }

      console.log(`\n📧 [EMAIL DISPATCH via Resend]`);
      console.log(`   To: ${maskedTo}`);
      console.log(`   Subject: ${subject || '[Notification]'}`);
      console.log(`   Status: Delivered via Resend ID: ${data?.id || 'OK'} ✅\n`);

      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error(`❌ [EMAIL DISPATCH EXCEPTION] Failed for ${maskedTo}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // Development / Mock fallback when RESEND_API_KEY is not configured yet
  console.log(`\n📧 [EMAIL DISPATCH (DEV MOCK)]`);
  console.log(`   To: ${maskedTo}`);
  console.log(`   Subject: ${subject || '[Notification]'}`);
  console.log(`   Status: Mock Delivered (Set RESEND_API_KEY in .env for live dispatch) ✅\n`);
  return { success: true, messageId: `mock_${Date.now()}` };
};

/**
 * Editorial Luxury HTML Template for Email Passcode
 */
export const generateOtpEmailHtml = (otpCode, recipientName = 'Patron') => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aarkis Security Verification</title>
    <style>
      body { margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C211B; }
      .wrapper { width: 100%; table-layout: fixed; background-color: #FAF7F2; padding: 40px 0; }
      .main { background-color: #FFFFFF; margin: 0 auto; width: 100%; max-width: 520px; border: 1px solid #E8E0D2; border-radius: 2px; }
      .header { padding: 40px 32px 20px 32px; text-align: center; border-bottom: 1px solid #F3EDE4; }
      .brand { font-size: 22px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: #281D18; margin: 0; }
      .tagline { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #B49A62; margin-top: 6px; }
      .content { padding: 36px 32px; font-size: 13px; line-height: 1.7; color: #4A3B32; }
      .salutation { font-size: 14px; font-weight: 600; color: #281D18; margin-bottom: 12px; }
      .otp-container { background-color: #FAF6EE; border: 1px solid #D8C2A0; text-align: center; padding: 24px 16px; margin: 28px 0; border-radius: 2px; }
      .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 0.3em; color: #281D18; margin: 0; }
      .otp-note { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #8E7766; margin-top: 8px; }
      .security-note { font-size: 11px; line-height: 1.6; color: #8E7766; margin-top: 24px; }
      .footer { background-color: #F8F5EF; padding: 24px 32px; text-align: center; font-size: 10px; color: #9E8C7E; line-height: 1.6; border-top: 1px solid #EFEAE0; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <table class="main" cellpadding="0" cellspacing="0" align="center">
        <tr>
          <td class="header">
            <h1 class="brand">AARKIS</h1>
            <p class="tagline">Haute Couture & Bespoke Fashion</p>
          </td>
        </tr>
        <tr>
          <td class="content">
            <p class="salutation">Dear ${recipientName},</p>
            <p>Please enter the single-use passcode below to securely authenticate your private wardrobe session and access your personal order history.</p>
            
            <div class="otp-container">
              <div class="otp-code">${otpCode}</div>
              <div class="otp-note">Valid for 10 minutes only</div>
            </div>

            <p class="security-note">
              This code was requested from the Aarkis Collection online boutique. If you did not make this request, please disregard this email. Your private account remains completely protected.
            </p>
          </td>
        </tr>
        <tr>
          <td class="footer">
            &copy; ${new Date().getFullYear()} AARKIS COLLECTION. All rights reserved.<br/>
            Private Client Concierge &bull; Automated Authentication Dispatch
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>
  `;
};
