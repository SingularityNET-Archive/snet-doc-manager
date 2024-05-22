// deleteFileFromDrive.js
import { google } from 'googleapis';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uris = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

export const handler = async (event, context) => {
  const { fileId } = JSON.parse(event.body);

  if (!fileId) {
    console.error('Missing fileId in the request body');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad Request: Missing fileId' }),
    };
  }

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    await drive.files.delete({ fileId });
    console.log('File deleted successfully:', fileId);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File deleted successfully' }),
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};