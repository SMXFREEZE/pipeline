#!/usr/bin/env node

/**
 * Generate Apple Music Developer Token from .p8 private key
 * Usage: npm run generate-apple-token
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const config = {
  keyFile: process.env.APPLE_MUSIC_KEY_FILE,
  keyId: process.env.APPLE_MUSIC_KEY_ID,
  teamId: process.env.APPLE_MUSIC_TEAM_ID,
};

function generateAppleMusicToken() {
  try {
    // Validate required environment variables
    if (!config.keyFile || !config.keyId || !config.teamId) {
      throw new Error(
        'Missing required environment variables in .env file:\n' +
          '  APPLE_MUSIC_KEY_FILE, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_TEAM_ID'
      );
    }

    // Read the private key
    const keyPath = path.resolve(config.keyFile);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Private key file not found: ${keyPath}`);
    }

    const privateKey = fs.readFileSync(keyPath, 'utf8');

    // Generate JWT token (6 months expiration)
    const payload = {
      iss: config.teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 6 * 30 * 24 * 60 * 60,
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      keyid: config.keyId,
    });

    // Automatically save to .env file
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const updatedContent = envContent.replace(
        /EXPO_PUBLIC_APPLE_MUSIC_TOKEN=.*/,
        `EXPO_PUBLIC_APPLE_MUSIC_TOKEN=${token}`
      );
      fs.writeFileSync(envPath, updatedContent);
      console.log('✅ Apple Music JWT token generated and saved to .env');
      console.log('⏰ Token expires in 6 months');
    } else {
      console.log('✅ Token generated. Add this to your .env file:');
      console.log(`EXPO_PUBLIC_APPLE_MUSIC_TOKEN=${token}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateAppleMusicToken();
}

module.exports = { generateAppleMusicToken };
