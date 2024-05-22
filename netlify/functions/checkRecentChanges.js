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
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
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
      console.error("Failed to check document for recent changes:", error);
      throw error;
    }
  }

  for (const doc of docs) {
    const hasRecentChanges = await checkDocumentForRecentChanges(doc);
    if (hasRecentChanges) {
      changedDocs.push(doc.google_id);
    }
  }
  console.log(
    `Found changes in ${changedDocs}`
  );
  return {
    statusCode: 200,
    body: JSON.stringify(changedDocs),
  };
};