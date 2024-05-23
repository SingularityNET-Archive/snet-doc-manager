// uploadDocs.js
import { supabaseAdmin } from '../../lib/supabaseClient';

export const handler = async (event, context) => {
  try {
    // Get the categorized links from the request body
    const categorizedLinks = JSON.parse(event.body);

    // Prepare the data for insertion into the documents table
    const documentsData = Object.entries(categorizedLinks).flatMap(([docType, docInfos]) =>
      (docInfos || []).map(docInfo => {
        const id = extractId(docInfo.doc_id, docType);
        return {
          google_id: id,
          url: docInfo.doc_id,
          workgroup: docInfo.workgroup,
          sharing_status: 'pending',
          all_copy_ids: [],
          latest_copy_g_id: null,
          doc_type: docType,
        };
      })
    );

    // Filter out duplicate Google Docs within the same workgroup
    const uniqueDocumentsData = Object.values(
      documentsData.reduce((acc, doc) => {
        const key = `${doc.google_id}_${doc.workgroup}`;
        if (doc.doc_type !== 'googleDocs' || !acc[key]) {
          acc[key] = doc;
        }
        return acc;
      }, {})
    );

    // Check for existing documents with the same google_id
    const googleIds = uniqueDocumentsData.map(doc => doc.google_id);
    const { data: existingDocs, error: selectError } = await supabaseAdmin
      .from('documents')
      .select('google_id')
      .in('google_id', googleIds);

    if (selectError) {
      console.error('Error selecting existing documents:', selectError);
      return { statusCode: 500, body: JSON.stringify({ error: selectError.message }) };
    }

    // Filter out documents that already exist
    const newDocumentsData = uniqueDocumentsData.filter(
      doc => !(existingDocs || []).some(existingDoc => existingDoc.google_id === doc.google_id)
    );

    // Insert the new documents data into the documents table
    const { data: insertedDocs, error: insertError } = await supabaseAdmin
      .from('documents')
      .insert(newDocumentsData);

    if (insertError) {
      console.error('Error inserting documents:', insertError);
      return { statusCode: 500, body: JSON.stringify({ error: insertError.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'New documents uploaded successfully',
        inserted: (insertedDocs || []).length,
        skipped: documentsData.length - (insertedDocs || []).length,
      }),
    };
  } catch (error) {
    console.error('Error in uploadDocs function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

// Helper function to extract the ID based on the document type
const extractId = (link, docType) => {
  if (docType === 'googleDocs' || docType === 'googleSpreadsheets') {
    return extractGoogleId(link);
  } else if (docType === 'miroBoards') {
    return extractMiroBoardId(link);
  } else if (docType === 'youTubeVideos') {
    return extractYouTubeVideoId(link);
  } else {
    return extractOtherId(link);
  }
};

// Helper function to extract the Google ID from the link
const extractGoogleId = link => {
  const url = new URL(link);
  const pathParts = url.pathname.split('/');
  const index = pathParts.findIndex(part => part === 'd');
  if (index !== -1 && index + 1 < pathParts.length) {
    return pathParts[index + 1];
  }
  return null;
};

// Helper function to extract the Miro board ID from the link
const extractMiroBoardId = link => {
  const url = new URL(link);
  const pathParts = url.pathname.split('/');
  return pathParts[pathParts.length - 2];
};

// Helper function to extract the YouTube video ID from the link
const extractYouTubeVideoId = link => {
  const url = new URL(link);
  const videoId = url.searchParams.get('v');
  if (videoId) {
    return videoId;
  }
  const pathParts = url.pathname.split('/');
  return pathParts[pathParts.length - 1];
};

// Helper function to extract the ID for non-Google URLs
const extractOtherId = link => {
  const url = new URL(link);
  const pathParts = url.pathname.split('/');
  return pathParts[pathParts.length - 1];
};