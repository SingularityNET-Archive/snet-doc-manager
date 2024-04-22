import { google } from 'googleapis';

// Hardcoded document IDs for testing
const documents = [
  { google_id: '1uebknjv2fZVFEOnTZFex_u6IWQoddDLEZq9o_U01pU8' },
  { google_id: '14zKw5pn-YWzBHIsx8yrGlo27hoD3S98VjqgRO3glcKE' }
];

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI; // Redirect URI used in your OAuth consent screen
const refresh_token = process.env.GOOGLE_REFRESH_TOKEN; // Ensure this token has Drive API permissions

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

// Set credentials
oauth2Client.setCredentials({
  refresh_token: refresh_token,
});

export const handler = async (event, context) => {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const results = [];

  for (let doc of documents) {
    try {
      const fileDetails = await drive.files.get({
        fileId: doc.google_id,
        fields: 'id, name, permissions(id, type, role)',
      });

      let sharingStatus;
      // Check if permissions are returned
      if (fileDetails.data.permissions && fileDetails.data.permissions.length > 0) {
        sharingStatus = fileDetails.data.permissions.map(permission => ({
          id: permission.id,
          type: permission.type,
          role: permission.role,
        }));
      } else {
        // Set a custom message if permissions are not available
        sharingStatus = [{id: 'anyoneWithLink', type: 'anyone', role: 'viewOnly'}];
      }

      results.push({ google_id: doc.google_id, sharingStatus: sharingStatus });
    } catch (error) {
      console.error(`Error fetching details for document ${doc.google_id}:`, error);
      results.push({ google_id: doc.google_id, error: error.message });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
