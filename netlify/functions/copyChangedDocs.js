// ../netlify/functions/copyChangedDocs.js
import { google } from 'googleapis';
import { supabaseAdmin } from '../../lib/supabaseServerSideClient';
//import { getOAuth2Client } from '../../utils/oauth2Client';
import { getGoogleAuth } from '../../utils/googleAuth';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

//const oauth2Client = getOAuth2Client();
const auth = getGoogleAuth();

async function getFolderId(folderPath) {
  const drive = google.drive({ version: 'v3', auth: auth });
  const folderNames = folderPath.split('/');

  let parentFolderId = 'root';
  for (const folderName of folderNames) {
    const response = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${folderName}' and '${parentFolderId}' in parents`,
      fields: 'files(id)',
    });

    if (response.data.files.length === 0) {
      // Folder not found, create it
      const folder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId],
        },
        fields: 'id',
      });
      parentFolderId = folder.data.id;
    } else {
      // Folder exists, update the parent folder ID
      parentFolderId = response.data.files[0].id;
    }
  }

  return parentFolderId;
}

async function makeCopyOfDocument(doc) {
  const drive = google.drive({ version: 'v3', auth: auth });
  try {
    const folderPath = `copies-of-documents/${doc.entity}/${doc.workgroup}`;
    const folderId = await getFolderId(folderPath);

    const response = await drive.files.copy({
      fileId: doc.google_id,
      requestBody: {
        name: 'Copy of ' + doc.google_id,
        parents: [folderId],
      },
    });
    console.log("Copied document ID:", response.data.id);
    return response.data.id;
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
      console.error('Failed to copy document:', error);
      await sendErrorMessageToDiscord(`Failed to check document for recent changes ${doc.google_id}: ${error.message}`);
      throw error;
    }
  }
}

export const handler = async (event, context) => {
  const { docs, statusChangeResponse, test } = JSON.parse(event.body);

  if (!docs || !statusChangeResponse) {
    console.error('Missing docs or statusChangeResponse in the request body');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad Request: Missing docs or statusChangeResponse' }),
    };
  }

  try {
    const changedDocsWithCopyIds = statusChangeResponse.map((changedDocId) => {
      const changedDoc = docs.find((doc) => doc.google_id === changedDocId);
      return changedDoc; // Return the entire changedDoc object
    });

    const copiedDocs = [];

    for (const doc of changedDocsWithCopyIds) {
      if (!test) {
        // Create a new copy
        const newDocId = await makeCopyOfDocument(doc); // Pass the entire doc object
        if (newDocId !== null) {
          // Update the all_copy_ids array by keeping the last two copies and adding the new one
          const updatedCopyIds = [...doc.all_copy_ids.slice(-2), newDocId].slice(-3);
          await supabaseAdmin
            .from('documents')
            .update({
              latest_copy_g_id: newDocId,
              all_copy_ids: updatedCopyIds,
            })
            .eq('google_id', doc.google_id);
          copiedDocs.push({
            google_id: doc.google_id,
            new_copy_id: newDocId,
            all_copy_ids: updatedCopyIds,
          });
        }
      }
    }

    console.log('Changed documents processed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Changed documents processed successfully',
        copied_docs: copiedDocs,
      }),
    };
  } catch (error) {
    console.error('Error copying changed documents:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};