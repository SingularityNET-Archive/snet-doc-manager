// checkRecentChanges.js
import { google } from "googleapis";

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
  const { docs } = JSON.parse(event.body);
  const changedDocs = [];

  async function checkDocumentForRecentChanges(doc) {
    const drive = google.drive({ version: "v3", auth: oauth2Client });
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
        // Return true to indicate that there was a change (access denied)
        return true;
      } else if (error.code === 404) {
        console.warn('File not found:', doc.google_id);
        // Return true to indicate that there was a change (file not found)
        return true;
      } else {
        console.error("Failed to check document for recent changes:", error);
        throw error; // Rethrow other errors
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