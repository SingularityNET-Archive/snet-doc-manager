// ../netlify/functions/deleteFileFromDrive.js
import { google } from 'googleapis';
//import { getOAuth2Client } from '../../utils/oauth2Client';
import { getGoogleAuth } from '../../utils/googleAuth';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

//const oauth2Client = getOAuth2Client();
const auth = getGoogleAuth();

export const handler = async (event, context) => {
  const { fileId } = JSON.parse(event.body);

  if (!fileId) {
    console.error('Missing fileId in the request body');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad Request: Missing fileId' }),
    };
  }

  const drive = google.drive({ version: 'v3', auth: auth });

  try {
    await drive.files.delete({ fileId });
    console.log('File deleted successfully:', fileId);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    await sendErrorMessageToDiscord(`Failed to delete document ${doc.google_id}: ${error.message}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};