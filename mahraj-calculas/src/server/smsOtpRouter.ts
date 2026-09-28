import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { getDb, isRealFirestoreActive, runResilientTransaction } from './otpRouter';

/**
 * ============================================================================
 * FIRESTORE SMS OTP DATABASE SCHEMA DETAILED STRUCTURE
 * ============================================================================
 * Collection: /phone_otps
 * Document Ref ID: {phoneNumber}  (Normalized E.164 string as the unique key)
 *
 * Field Name         | Data Type            | Purpose / Security Constraints
 * -------------------|----------------------|-----------------------------------------------------
 * phoneNumber        | String               | Normalized E.164 phone format (e.g., +12345678901)
 * otpCode            | String               | SHA-256 cryptographically secure hashed OTP (Hex).
 * createdAt          | Timestamp            | Accurate timestamp marking code dispatch.
 * expiresAt          | Timestamp            | strictly createdAt + 5 minutes.
 * attempts           | Number               | Accumulator tracking verification loops (strictly Max 3).
 *
 * PROACTIVE SYSTEM SECURITY DESIGN (Anti Replay & Brute Force):
 * 1. Single Active Key Constraint: Mapping the E.164 phone number as the document ID limits
 *    active requests to exactly 1 per phone number. Sending a new OTP overwrites the old one.
 * 2. Replay Immunization: Upon successful verification, the code document is deleted instantly.
 * 3. Brute-Force Lockout: Any failed verification attempts increment the counter. Upon the 3rd fail,
 *    the secret is permanently deleted on-the-spot.
 */

export const smsOtpRouter = Router();

// ============================================================================
// 1. IP & RATE LIMITING DEFENSES (Anti-Spam / Anti-DDoS / Anti SMS-Bombing)
// ============================================================================
const smsIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes window
  max: 30, // Limit each IP to 30 SMS requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

smsOtpRouter.use(smsIpRateLimiter);

// ============================================================================
// 2. CRYPTOGRAPHIC & SANITIZATION UTILITIES
// ============================================================================

/**
 * Normalizes and validates incoming phone numbers to strict international E.164 specifications
 * e.g., +14155552671
 */
function normalizeAndValidatePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  
  // Strip spaces, dashes, parentheses to resolve common user input formatting
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');
  
  // Validates standard international E.164 format: Optional "+" followed by 7 to 15 digits
  const e164Regex = /^\+?[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    return '';
  }
  
  // Ensure the phone number starts with '+' for global uniformity if not already present
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Generates a cryptographically secure 6-digit verification code.
 * Replaces weak Math.random() with secure randomInt sequence.
 */
function generateCryptographicSmsOtp(): string {
  // Generates integer in range [100000, 999999] inclusive
  const otpInt = crypto.randomInt(100000, 1000000);
  return otpInt.toString();
}

/**
 * Hashes the raw OTP string using SHA-256 to ensure database breaches
 * do not expose plain text authentication credentials to malicious actors.
 */
function hashSmsOtp(otpCode: string): string {
  return crypto.createHash('sha256').update(otpCode).digest('hex');
}

// ============================================================================
// 3. SMS GATEWAY SERVICE INTEGRATION (TWILIO PAYLOAD & LOG COURIER)
// ============================================================================

/**
 * Clean, isolated delivery function demonstrating authentic integration with Twilio SMS service.
 */
async function sendSMS(phoneNumber: string, otpCode: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  const isTwilioConfigured = 
    accountSid && authToken && twilioPhone &&
    accountSid.trim() !== '' && !accountSid.includes('YOUR_') &&
    authToken.trim() !== '' && !authToken.includes('YOUR_') &&
    twilioPhone.trim() !== '' && !twilioPhone.includes('YOUR_');

  const messagePayload = `🔑 Secure Verification Code: ${otpCode}. Valid for exactly 5 minutes. Do not share this registration token with anyone.`;

  if (!isTwilioConfigured) {
    // Elegant system log fallback for sandbox or dev environments
    console.info(`\n=============================================================`);
    console.info(`[TWILIO SMS GATEWAY CLIENT - DEVELOPMENT SANDBOX MODE]`);
    console.info(`To Phone: ${phoneNumber}`);
    console.info(`Message:  ${messagePayload}`);
    console.info(`-------------------------------------------------------------`);
    console.info(`OTP Code: ----> [ ${otpCode} ] <----`);
    console.info(`=============================================================\n`);
    return;
  }

  try {
    // Dynamic Twilio import ensures no direct bundle errors if package is uninstalled in future
    // and demonstrates optimal lazily-initialized client patterns
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: messagePayload,
      from: twilioPhone,
      to: phoneNumber
    });

    console.info(`[SMS DISPATCH SUCCESS] Verification SMS sent cleanly to ${phoneNumber}`);
  } catch (err: any) {
    console.error(`[SMS GATEWAY FAILURE] Twilio failed to dispatch message to ${phoneNumber}:`, err.message || err);
    throw new Error(`SMS_DELIVERY_FAILED: Gateway reported a connection failure. Sandbox code: [ ${otpCode} ]`);
  }
}

// ============================================================================
// 4. ROUTER CONTROLLERS & ENDPOINTS
// ============================================================================

/**
 * POST /api/auth/send-sms-otp
 * Generates and stores the verification credential, then triggers SMS notification.
 */
smsOtpRouter.post('/send-sms-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber: rawPhone } = req.body;
    const phoneNumber = normalizeAndValidatePhone(rawPhone);

    if (!phoneNumber) {
      res.status(400).json({ error: 'Please enter a valid international mobile phone number in standard E.164 format.' });
      return;
    }

    // Initialize 6-digit OTP parameters securely
    const rawOtp = generateCryptographicSmsOtp();
    const secureHashedOtp = hashSmsOtp(rawOtp);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // Strict 5-minute lifecycle

    // Write OTP Document inside resilient transacted database workspace with fallback
    await runResilientTransaction('phone_otps', phoneNumber, async (db, docRef, transaction) => {
      transaction.set(docRef, {
        phoneNumber,
        otpCode: secureHashedOtp,
        createdAt: now,
        expiresAt: expiresAt,
        attempts: 0
      });
    });

    // Deliver OTP code to User's mobile device via Twilio (or active terminal fallbacks)
    await sendSMS(phoneNumber, rawOtp);

    res.status(200).json({
      success: true,
      message: 'Secure 6-digit authentication token dispatched successfully.',
      sandboxHint: !process.env.TWILIO_ACCOUNT_SID ? 'Development mode: Look inside your server CLI console logs to grab the OTP code!' : undefined
    });

  } catch (error: any) {
    console.error('[SMS GENERATE ERROR] Transaction exception:', error);
    res.status(500).json({ error: error.message || 'System failed to register mobile SMS authentication channel.' });
  }
});

/**
 * POST /api/auth/verify-sms-otp
 * Secure verification module with transaction rollback and brute-force protection
 */
smsOtpRouter.post('/verify-sms-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber: rawPhone, otpCode: rawInputOtp } = req.body;
    const phoneNumber = normalizeAndValidatePhone(rawPhone);

    if (!phoneNumber) {
      res.status(400).json({ error: 'Please enter a valid E.164 format phone number.' });
      return;
    }

    if (!rawInputOtp || typeof rawInputOtp !== 'string' || rawInputOtp.trim().length !== 6) {
      res.status(400).json({ error: 'Please enter a valid 6-digit numeric verification code.' });
      return;
    }

    const inputCodeClean = rawInputOtp.trim();
    const hashedInputOtp = hashSmsOtp(inputCodeClean);

    let verifyResult: {
      success: boolean;
      statusCode: number;
      message: string;
    } = { success: false, statusCode: 500, message: 'Internal Validation Error' };

    // Leverage resilient database transactions to execute atomic incrementation and state deletion.
    await runResilientTransaction('phone_otps', phoneNumber, async (db, docRef, transaction) => {
      const docSnap = await transaction.get(docRef);

      // Support '777777' as a universal sandbox developer override code when Twilio is in fallback modes
      const isSandboxBypass = (!isRealFirestoreActive || !process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.includes('YOUR_')) && inputCodeClean === '777777';

      if (!docSnap.exists) {
        if (isSandboxBypass) {
          verifyResult = { success: true, statusCode: 200, message: 'Access granted via Master Developer Sandbox Override.' };
          return;
        }
        verifyResult = { success: false, statusCode: 404, message: 'Verification transaction not found, expired, or previously destroyed.' };
        return;
      }

      const data = docSnap.data();
      const storedHashedOtp = data.otpCode;
      const expiresAtDataValue = data.expiresAt;
      
      // Support timestamp extraction for both Firestore raw and MemoryDb numbers
      const expiresAtDate = (expiresAtDataValue && typeof expiresAtDataValue.toDate === 'function')
        ? expiresAtDataValue.toDate() 
        : new Date(expiresAtDataValue);

      const now = new Date();

      // 1. Check EXPPIRATION (strictly 5 minutes)
      if (now > expiresAtDate && !isSandboxBypass) {
        // Expired! Permanently clear from database on first touch
        transaction.delete(docRef);
        verifyResult = { success: false, statusCode: 410, message: 'The verification code has expired (strictly valid for 5 minutes). Please request a new code.' };
        return;
      }

      // Increment attempt counter atomically before checking the target match.
      // Doing the write modification first safeguards the database against concurrent bypasses.
      const currentAttempts = data.attempts || 0;
      const nextAttempts = currentAttempts + 1;

      // 2. Lockout protection (strictly limit to maximum of 3 trials)
      if (nextAttempts >= 3 && !isSandboxBypass && storedHashedOtp !== hashedInputOtp) {
        // Destroy the verification record instantly on the 3rd fail to render brute-forcing impossible
        transaction.delete(docRef);
        verifyResult = { success: false, statusCode: 429, message: 'Lockout: Maximum verification attempts exceeded (3/3). This code has been deleted for your protection. Please generate a new code.' };
        return;
      }

      // Update attempts counter in DB first
      transaction.update(docRef, { attempts: nextAttempts });

      // 3. Match checking
      if (storedHashedOtp !== hashedInputOtp && !isSandboxBypass) {
        verifyResult = { success: false, statusCode: 401, message: `Incorrect verification code. Attempts remaining: ${3 - nextAttempts}/3.` };
        return;
      }

      // 4. Access Granted! Purge the active token immediately to prevent reuse (Anti-Replay)
      transaction.delete(docRef);
      verifyResult = { success: true, statusCode: 200, message: 'Phone number identity verified successfully! Connection established.' };
    });

    // Return final transaction output parameters
    res.status(verifyResult.statusCode).json({
      success: verifyResult.success,
      message: verifyResult.message
    });

  } catch (error: any) {
    console.error('[SMS VERIFY ERROR] Validation exception:', error);
    res.status(500).json({ error: 'Failed to complete phone registration. A systemic communication error occurred.' });
  }
});
