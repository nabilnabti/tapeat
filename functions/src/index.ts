import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: functions.config().smtp?.user || process.env.SMTP_USER,
    pass: functions.config().smtp?.pass || process.env.SMTP_PASS
  }
});

export const sendVerificationCode = functions.https.onCall(async (data, context) => {
  const { email } = data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code in Firestore with expiration
    await admin.firestore().collection('verificationCodes').doc(email).set({
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send verification email
    await transporter.sendMail({
      from: '"TapEat" <noreply@tapeat.fr>',
      to: email,
      subject: 'Votre code de vérification TapEat',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10B981;">Votre code de vérification</h1>
          <p>Voici votre code de vérification pour TapEat :</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 10px;">
            <h2 style="font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h2>
          </div>
          <p style="color: #6B7280; margin-top: 20px;">Ce code expirera dans 10 minutes.</p>
        </div>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw new functions.https.HttpsError('internal', 'Error sending verification code');
  }
});

export const verifyCode = functions.https.onCall(async (data, context) => {
  const { email, code } = data;
  
  if (!email || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and code are required');
  }

  try {
    const codeDoc = await admin.firestore().collection('verificationCodes').doc(email).get();
    
    if (!codeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Code not found');
    }

    const codeData = codeDoc.data();
    if (!codeData) {
      throw new functions.https.HttpsError('not-found', 'Invalid code data');
    }

    // Check expiration
    if (codeData.expiresAt.toMillis() < Date.now()) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Code expired');
    }

    // Verify code
    if (codeData.code !== code) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid code');
    }

    // Delete used code
    await admin.firestore().collection('verificationCodes').doc(email).delete();

    return { valid: true };
  } catch (error) {
    console.error('Error verifying code:', error);
    throw new functions.https.HttpsError('internal', 'Error verifying code');
  }
});