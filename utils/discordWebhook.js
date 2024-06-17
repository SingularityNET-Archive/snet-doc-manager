// utils/discordWebhook.js
import fetch from 'node-fetch';

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

export async function sendErrorMessageToDiscord(errorMessage) {
  try {
    const payload = {
      content: errorMessage,
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Error message sent to Discord channel');
  } catch (error) {
    console.error('Failed to send error message to Discord:', error);
  }
}