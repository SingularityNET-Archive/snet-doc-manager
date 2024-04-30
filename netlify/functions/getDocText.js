// getDocText.js
import { google } from 'googleapis';
import { supabaseAdmin } from '../../lib/supabaseClient';

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
  const { docs, statusChangeResponse, test } = JSON.parse(event.body);

  async function getDocumentText(doc) {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    try {
      const response = await docs.documents.get({
        documentId: doc.google_id,
      });
      const content = response.data.body.content;
      let docText = '';
      content.forEach((element) => {
        if (element.paragraph) {
          element.paragraph.elements.forEach((el) => {
            if (el.textRun && el.textRun.content) {
              docText += el.textRun.content;
            }
          });
        }
      });
      return docText;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        return ''; // Return an empty string or any other default value you prefer
      } else {
        console.error('Error retrieving document text:', error);
        throw error; // Rethrow other errors
      }
    }
  }

  try {
    const changedDocs = docs.filter((doc) =>
      statusChangeResponse.includes(doc.google_id)
    );

    for (const doc of changedDocs) {
      const documentText = await getDocumentText(doc);
      if (!test) {
        await supabaseAdmin
          .from('documents')
          .update({ document_text: documentText })
          .eq('google_id', doc.google_id);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Document text retrieved and saved successfully' }),
    };
  } catch (error) {
    console.error('Error retrieving and saving document text:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};