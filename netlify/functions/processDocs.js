import { supabase } from '../../lib/supabaseClient';
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

exports.handler = async (event, context) => {
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
        await supabase
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
  const docs = google.docs({version: 'v1', auth: oauth2Client});

  try {
    // Example: Get the document's title to check for changes
    const response = await docs.documents.get({
      documentId: doc.google_id,
    });
    console.log("Document title:", response.data.title);
    // Add logic to determine if changes were made
    return false; // Placeholder: return true if changes are detected
  } catch (error) {
    console.error("Failed to get document:", error);
    throw error; // Rethrow or handle as needed
  }
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
