// ../netlify/functions/copyGoogleDocument.js
import { google } from 'googleapis';
import { getOAuth2Client } from '../../utils/oauth2Client';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

const oauth2Client = getOAuth2Client();

async function makeCopyOfDocument(doc, folderId, rationale) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  try {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).replace(/ /g, '-');

    const response = await drive.files.copy({
      fileId: doc.google_id,
      requestBody: {
        name: `${formattedDate}-copy-of-${doc.title}`,
        parents: [folderId],
        properties: {
          'originalDocId': doc.google_id,
          'entity': doc.entity,
          'workgroup': doc.workgroup
        },
        description: `Rationale for creating this copy: ${rationale}`,
      },
    });
    console.log("Copied document ID:", response.data.id);
    return response.data.id;
  } catch (error) {
    if (error.code === 403) {
      console.warn('Access denied for document:', doc.google_id);
      await sendErrorMessageToDiscord(`Access denied for document: ${doc.google_id}`);
      return null;
    } else if (error.code === 404) {
      console.warn('File not found:', doc.google_id);
      await sendErrorMessageToDiscord(`File not found: ${doc.google_id}`);
      return null;
    } else if (error.code === 401 && error.message.includes('invalid_grant')) {
      console.error('Refresh token expired. Please obtain a new refresh token.');
      await sendErrorMessageToDiscord('Google Refresh Token Expired. Please obtain a new refresh token.');
      throw error;
    } else {
      console.error('Failed to copy document:', error);
      await sendErrorMessageToDiscord(`Failed to check document for recent changes ${doc.google_id}: ${error.message}`);
      throw error;
    }
  }
}

export const handler = async (event, context) => {
  const { doc, folderId, rationale } = JSON.parse(event.body);

  if (!doc || !folderId || !rationale) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad Request: Missing required parameters' }),
    };
  }

  try {
    const newDocId = await makeCopyOfDocument(doc, folderId, rationale);
    if (newDocId) {
      return {
        statusCode: 200,
        body: JSON.stringify({ newDocId }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Document not found or access denied' }),
      };
    }
  } catch (error) {
    console.error('Error copying document:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};