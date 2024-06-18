// getDocText.js
import { google } from 'googleapis';
import { supabaseAdmin } from '../../lib/supabaseServerSideClient';
import { getOAuth2Client } from '../../utils/oauth2Client';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

const oauth2Client = getOAuth2Client();

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
        await sendErrorMessageToDiscord(`Access denied for document: ${doc.google_id}`);
        return true;
      } else if (error.code === 404) {
        console.warn('File not found:', doc.google_id);
        await sendErrorMessageToDiscord(`File not found: ${doc.google_id}`);
        return true;
      } else if (error.code === 401 && error.message.includes('invalid_grant')) {
        console.error('Refresh token expired. Please obtain a new refresh token.');
        await sendErrorMessageToDiscord('Google Refresh Token Expired. Please obtain a new refresh token.');
        throw error;
      } else {
        console.error('Failed to retrieve document text:', error);
        await sendErrorMessageToDiscord(`Failed to retrieve document text ${doc.google_id}: ${error.message}`);
        throw error;
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