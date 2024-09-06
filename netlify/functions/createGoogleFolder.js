// ../netlify/functions/createGoogleFolder.js
import { google } from 'googleapis';
//import { getOAuth2Client } from '../../utils/oauth2Client';
import { getGoogleAuth } from '../../utils/googleAuth';

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

export const handler = async (event, context) => {
  const { folderPath } = JSON.parse(event.body);

  if (!folderPath) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad Request: Missing folderPath' }),
    };
  }

  try {
    const folderId = await getFolderId(folderPath);
    return {
      statusCode: 200,
      body: JSON.stringify({ folderId }),
    };
  } catch (error) {
    console.error('Error creating folder:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};