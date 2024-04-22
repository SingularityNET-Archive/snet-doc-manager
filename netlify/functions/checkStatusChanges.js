//checkStatusChanges.js
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

oauth2Client.setCredentials({
  refresh_token: refreshToken,
});

export const handler = async (event, context) => {
  const { docs } = JSON.parse(event.body);
  console.log(docs)
  const changedDocs = [];

  async function checkDocumentForChanges(doc) {
    const drive = google.drive({version: 'v3', auth: oauth2Client});
  
    try {
      const fileResponse = await drive.files.get({
        fileId: doc.google_id,
        fields: 'capabilities(canComment, canDownload, canEdit)',
      });

      let currentStatus = 'restricted'; // Default to the most restrictive if no capabilities are true

      if (fileResponse.data.capabilities.canEdit) {
        currentStatus = 'open'; // Allows editing
      } else if (fileResponse.data.capabilities.canComment) {
        currentStatus = 'comment'; // Allows commenting, but not editing
      } else if (fileResponse.data.capabilities.canDownload) {
        currentStatus = 'view only'; // Assumes 'view only' if canDownload is true
      }

      const hasStatusChanged = currentStatus !== doc.sharing_status;
      if (hasStatusChanged) {
        console.log(`Updated status for document ${doc.google_id} from ${doc.sharing_status} to ${currentStatus}`);
        // Push the updated document info to changedDocs
        changedDocs.push({
          google_id: doc.google_id,
          previous_status: doc.sharing_status, 
          current_status: currentStatus, 
        });
      }

      return hasStatusChanged;
    } catch (error) {
      if (error.code === 404) { // File not found
        console.error(`Document ${doc.google_id} not found:`, error);
        // Treat not found as restricted and consider it a status change if previous status is not 'restricted'
        const previousStatus = doc.sharing_status || 'unknown';
        if (previousStatus !== 'restricted') {
          changedDocs.push({
            google_id: doc.google_id,
            previous_status: previousStatus,
            current_status: 'restricted',
          });
        }
      } else {
        console.error('Failed to fetch document details:', error);
      }
      return false;
    }
  }
  
  for (const doc of docs) {
    await checkDocumentForChanges(doc); // Process each document for changes
  }

  return { statusCode: 200, body: JSON.stringify(changedDocs) };
};
