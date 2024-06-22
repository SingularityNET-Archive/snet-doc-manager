// ../netlify/functions/createManualCopyOfGoogleDoc.js
import { google } from 'googleapis';
import { getOAuth2Client } from '../../utils/oauth2Client';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

const oauth2Client = getOAuth2Client();

async function getFolderId(folderPath) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
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
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  try {
    const folderPath = `manual-copies-of-documents/${doc.entity}/${doc.workgroup}`;
    const folderId = await getFolderId(folderPath);

    const response = await drive.files.copy({
      fileId: doc.google_id,
      requestBody: {
        name: 'Manual Copy of ' + doc.google_id,
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
  const { docs, test } = JSON.parse(event.body);

  if (!docs) {
    console.error('Missing docs in the request body');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad Request: Missing docs' }),
    };
  }

  try {

    const copiedDocs = [];

    for (const doc of docs) {
      if (!test) {
        // Create a new copy
        const newDocId = await makeCopyOfDocument(doc); // Pass the entire doc object
        if (newDocId !== null) {
          copiedDocs.push({
            google_id: doc.google_id,
            new_copy_id: newDocId,
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