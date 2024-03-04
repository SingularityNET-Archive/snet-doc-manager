//processDocs.js
import { supabase, supabaseAdmin } from '../../lib/supabaseClient';
import { google } from 'googleapis';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uris = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

const oauth2Client = new google.auth.OAuth2(
  client_id, 
  client_secret, 
  redirect_uris // The first redirect URI configured in the Google Cloud Console
);

// Assuming you have the refresh token stored securely
oauth2Client.setCredentials({
  refresh_token: refreshToken,
});

async function getValidAccessToken() {
  const { token } = await oauth2Client.getAccessToken();
  return token;
}

export const handler = async (event, context) => {
  // Fetch document list from Supabase
  const { data: docs, error } = await supabase
    .from('documents')
    .select('*');

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch documents' }) };
  }
  let accessToken = await getValidAccessToken()
  console.log(accessToken)
  for (const doc of docs) {
    try {
      console.log("doc", doc);
      const hasChanges = await checkDocumentForChanges(doc);
      
      if (hasChanges) {
        const newDocId = await makeCopyOfDocument(doc.google_id);
        await supabaseAdmin
          .from('documents')
          .update({ latest_copy_g_id: newDocId })
          .match({ google_id: doc.google_id });
      }
    } catch (error) {
      console.error("Error processing document:", doc, error);
      // Depending on your error handling strategy, you might want to return here or continue with the next document
    }
  }  

  return { statusCode: 200, body: 'Process completed' };
};

async function checkDocumentForChanges(doc) {
  const drive = google.drive({version: 'v3', auth: oauth2Client});

  try {
    // Fetch the document's current permissions
    const permissions = await drive.permissions.list({
      fileId: doc.google_id,
      fields: 'permissions(id, type, role)',
    });
    
    // Determine the current sharing status based on permissions
    const currentStatus = determineSharingStatus(permissions.data.permissions);

    // Compare current status with the last known status stored in your database
    const hasStatusChanged = currentStatus !== doc.sharing_status;

    if (hasStatusChanged) {
      // Document sharing status has changed, update the database
      await supabaseAdmin
        .from('documents')
        .update({ sharing_status: currentStatus })
        .match({ google_id: doc.google_id });

      console.log(`Updated sharing status for document ${doc.google_id} to ${currentStatus}`);
    }

    // Return whether there was a change in sharing status or not
    return hasStatusChanged;
  } catch (error) {
    console.error("Failed to check document for changes:", error);
    throw error; // Rethrow or handle as needed
  }
}

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
    // Additional logic for 'user', 'group', 'domain' types can be added here
  });
  return status;
}


async function makeCopyOfDocument(docId) {
  const drive = google.drive({version: 'v3', auth: oauth2Client});
  try {
    const response = await drive.files.copy({
      fileId: docId,
      requestBody: {
        name: 'Copy of ' + docId, // You might want to customize the copied document's name
      },
    });
    console.log("Copied document ID:", response.data.id);
    return response.data.id;
  } catch (error) {
    console.error("Failed to copy document:", error);
    throw error; // Rethrow or handle as needed
  }
}
