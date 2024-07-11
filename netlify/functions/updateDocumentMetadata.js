// ../netlify/functions/updateDocumentMetadata.js
import { supabaseAdmin } from '../../lib/supabaseServerSideClient';

export const handler = async (event, context) => {
  const { google_id, metadata } = JSON.parse(event.body);

  if (!google_id || !metadata) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' }),
    };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update({ metadata: metadata })  // Don't stringify, send as is
      .eq('google_id', google_id);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Document metadata updated successfully', data }),
    };
  } catch (error) {
    console.error('Error updating document metadata:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update document metadata', details: error.message }),
    };
  }
};