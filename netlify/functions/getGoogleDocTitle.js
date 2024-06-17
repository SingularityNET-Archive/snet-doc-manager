// getGoogleDocTitle.js
import { google } from "googleapis";
import { getOAuth2Client } from '../../utils/oauth2Client';

const oauth2Client = getOAuth2Client();

export const handler = async (event, context) => {
  const { googleDocId } = JSON.parse(event.body);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  try {
    // Retrieve the document metadata
    const fileMetadata = await drive.files.get({
      fileId: googleDocId,
      fields: "name",
    });

    const title = fileMetadata.data.name;
    return {
      statusCode: 200,
      body: JSON.stringify({ title }),
    };
  } catch (error) {
    console.error("Failed to retrieve Google Doc title:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve Google Doc title" }),
    };
  }
};