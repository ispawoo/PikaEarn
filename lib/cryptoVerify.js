// lib/cryptoVerify.js
import crypto from 'crypto';

/**
 * Verifies the integrity of the data received from the Telegram WebApp.
 * 
 * Telegram documentation:
 * To verify data, construct a data-check-string by sorting alphabetically
 * all received fields (excluding 'hash'), joined by '\n' in format 'key=value'.
 * Then, calculate SHA256 HMAC of "WebAppData" with your BOT_TOKEN to get secret_key.
 * Finally, calculate SHA256 HMAC of data-check-string with secret_key to compare with 'hash'.
 * 
 * @param {string} initDataString - The raw window.Telegram.WebApp.initData string.
 * @returns {object} { isValid: boolean, user: object|null, reason: string|null, isMock: boolean }
 */
export function verifyTelegramInitData(initDataString) {
  if (!initDataString) {
    return { isValid: false, user: null, reason: 'Missing initData string' };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // 1. Enable seamless developer testing in local development environments or on default placeholders
  const isDev = process.env.NODE_ENV !== 'production';
  const isPlaceholderToken = !botToken || botToken === 'placeholder-bot-token' || botToken === 'your-telegram-bot-token-here';

  if (isPlaceholderToken || (isDev && initDataString.startsWith('mock_user_'))) {
    // If the client sends a mock query (e.g. mock_user_123456), bypass cryptographics for easy local test
    if (initDataString.startsWith('mock_user_')) {
      const mockIdStr = initDataString.replace('mock_user_', '');
      const mockId = parseInt(mockIdStr) || 123456789;
      return {
        isValid: true,
        user: {
          id: mockId,
          username: `pika_master_${mockIdStr}`,
          first_name: 'Pika',
          last_name: 'Earner',
        },
        isMock: true
      };
    }
    
    // In developer mode, we can also parse simple JSON or queries for convenience
    try {
      const params = new URLSearchParams(initDataString);
      const userJSON = params.get('user');
      if (userJSON) {
        return {
          isValid: true,
          user: JSON.parse(userJSON),
          isMock: true
        };
      }
    } catch (e) {
      // ignore
    }

    if (isPlaceholderToken) {
      return { 
        isValid: false, 
        user: null, 
        reason: 'Telegram token is not configured. For local testing, prefix your initData with "mock_user_<id>" (e.g. mock_user_777777).' 
      };
    }
  }

  try {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    
    if (!hash) {
      return { isValid: false, user: null, reason: 'Hash parameter is missing' };
    }

    // 1. Filter out the hash, sort keys alphabetically
    const keys = Array.from(params.keys()).filter((key) => key !== 'hash');
    keys.sort();

    // 2. Reconstruct the data-check-string
    const dataCheckString = keys
      .map((key) => `${key}=${params.get(key)}`)
      .join('\n');

    // 3. Derive the secret key: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // 4. Calculate signature of the data-check-string
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // 5. Compare signatures
    if (computedHash === hash) {
      const userJSON = params.get('user');
      const user = userJSON ? JSON.parse(userJSON) : null;
      return { 
        isValid: true, 
        user, 
        isMock: false 
      };
    }

    return { 
      isValid: false, 
      user: null, 
      reason: 'Cryptographic signature mismatch. The request has been tampered with or the token is incorrect.' 
    };
  } catch (error) {
    return { 
      isValid: false, 
      user: null, 
      reason: `Verification error: ${error.message}` 
    };
  }
}
