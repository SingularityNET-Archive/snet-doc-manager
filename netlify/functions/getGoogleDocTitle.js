// getGoogleDocTitle.js
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