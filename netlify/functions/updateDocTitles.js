// ../netlify/functions/updateDocTitles.js
import { supabaseAdmin } from '../../lib/supabaseServerSideClient';
import { google } from 'googleapis';
import { getOAuth2Client } from '../../utils/oauth2Client';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

const fetchGoogleDocTitle = async (googleDocId) => {
  const oauth2Client = getOAuth2Client();
  const docs = google.docs({ version: 'v1', auth: oauth2Client });

  try {
    const doc = await docs.documents.get({
      documentId: googleDocId,
    });

    return doc.data.title;
  } catch (error) {
    if (error.code === 403) {
      console.error('Insufficient permissions to access the Google Doc:', error);
      await sendErrorMessageToDiscord(`Insufficient permissions for document: ${googleDocId}`);
      return 'Access Denied';
    } else if (error.code === 404) {
      console.error('Google Doc not found:', error);
      await sendErrorMessageToDiscord(`Google Doc not found: ${googleDocId}`);
      return 'File Not Found';
    } else {
      console.error('Failed to retrieve Google Doc title:', error);
      await sendErrorMessageToDiscord(`Failed to retrieve Google Doc title for document: ${googleDocId}`);
      return 'Name Unavailable';
    }
  }
};

export const handler = async (event, context) => {
  try {
    // Fetch all documents from the documents table
    const { data: documents, error: selectError } = await supabaseAdmin
      .from('documents')
      .select('id, google_id, title, doc_type');

    if (selectError) {
      console.error('Error fetching documents:', selectError);
      return { statusCode: 500, body: JSON.stringify({ error: selectError.message }) };
    }

    // Filter out documents that are not Google Docs
    const googleDocs = documents.filter(doc => doc.doc_type === 'googleDocs');

    // Fetch document titles concurrently
    const titlePromises = googleDocs.map(async (doc) => {
      const currentTitle = await fetchGoogleDocTitle(doc.google_id);
      return { id: doc.id, title: currentTitle };
    });

    const titleResults = await Promise.all(titlePromises);

    // Prepare updates for documents with changed titles
    const updates = titleResults
      .filter(result => result.title !== 'File Not Found' && result.title !== 'Access Denied')
      .map(result => ({
        id: result.id,
        title: result.title,
      }));

    // Update document titles in the Supabase database
    if (updates.length > 0) {
      const { data: updatedDocs, error: updateError } = await supabaseAdmin
        .from('documents')
        .upsert(updates, { returning: 'minimal' });

      if (updateError) {
        console.error('Error updating document titles:', updateError);
        return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Document titles updated successfully',
        updated: updates.length,
      }),
    };
  } catch (error) {
    console.error('Error in updateDocTitles function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};