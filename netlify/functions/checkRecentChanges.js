// ../netlify/functions/checkRecentChanges.js
import { google } from "googleapis";
//import { getOAuth2Client } from '../../utils/oauth2Client';
import { getGoogleAuth } from '../../utils/googleAuth';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

//const oauth2Client = getOAuth2Client();
const auth = getGoogleAuth();

export const handler = async (event, context) => {
  const { docs } = JSON.parse(event.body);
  const changedDocs = [];

  async function checkDocumentForRecentChanges(doc) {
    const drive = google.drive({ version: "v3", auth: auth });
    try {
      // Calculate the timestamp for 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 8);
      const sevenDaysAgoISOString = sevenDaysAgo.toISOString();

      // Retrieve the document metadata
      const fileMetadata = await drive.files.get({
        fileId: doc.google_id,
        fields: "modifiedTime",
      });

      // Check if the document was modified within the last 7 days
      const modifiedTime = new Date(fileMetadata.data.modifiedTime);
      const hasRecentChanges = modifiedTime > sevenDaysAgo;

      return hasRecentChanges;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        await sendErrorMessageToDiscord(`Access denied for document: ${doc.google_id}`);
        return true;
      } else if (error.code === 404) {
        console.warn('File not found:', doc.google_id);
        await sendErrorMessageToDiscord(`File not found: ${doc.google_id}`);
        return true;
      } else if (error.code === 401 && error.message.includes('invalid_grant')) {
        console.error('Refresh token expired. Please obtain a new refresh token.');
        await sendErrorMessageToDiscord('Google Refresh Token Expired. Please obtain a new refresh token.');
        throw error;
      } else {
        console.error('Failed to check document for recent changes:', error);
        await sendErrorMessageToDiscord(`Failed to check document for recent changes: ${error.message}`);
        throw error;
      }
    }
  }

  for (const doc of docs) {
    const hasRecentChanges = await checkDocumentForRecentChanges(doc);
    if (hasRecentChanges) {
      changedDocs.push(doc.google_id);
    }
  }

  console.log(`Found changes in ${changedDocs}`);

  return {
    statusCode: 200,
    body: JSON.stringify(changedDocs),
  };
};