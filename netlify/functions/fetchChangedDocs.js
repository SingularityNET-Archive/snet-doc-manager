// fetchChangedDocs.js
import { supabaseAdmin } from '../../lib/supabaseClient';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export const handler = async (event, context) => {
  const drive = google.drive({version: 'v3', auth: oauth2Client});
  const changedDocs = [];

  const { data: docs, error } = await supabaseAdmin
    .from('documents')
    .select('google_id, sharing_status');

  if (error) {
    console.error("Error fetching documents:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch documents" }) };
  }

  for (const doc of docs) {
    try {
      const permissions = await drive.permissions.list({
        fileId: doc.google_id,
        fields: 'permissions(id, type, role)',
      });
      const currentStatus = determineSharingStatus(permissions.data.permissions);
      
      if (currentStatus !== doc.sharing_status) {
        changedDocs.push(doc.google_id);
      }
    } catch (error) {
      console.error(`Failed to check document ${doc.google_id}:`, error);
      // Continue checking the next document even if one fails
    }
  }

  return { statusCode: 200, body: JSON.stringify(changedDocs) };
};

function determineSharingStatus(permissions) {
  let status = 'view only'; // Default to the most restrictive
  permissions.forEach(permission => {
    if (permission.type === 'anyone') {
      if (permission.role === 'writer') {
        status = 'open';
      } else if (permission.role === 'commenter') {
        status = 'comment';
      } else {
        status = 'view only';
      }
    }
  });
  return status;
}
