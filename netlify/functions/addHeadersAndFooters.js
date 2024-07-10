import { google } from 'googleapis';
import { getOAuth2Client } from '../../utils/oauth2Client';

const oauth2Client = getOAuth2Client();

export const handler = async (event, context) => {
  const { documentId, formattedDate, originalDocId, ownerUsername, workgroup } = JSON.parse(event.body);

  if (!documentId || !formattedDate || !originalDocId || !ownerUsername || !workgroup) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' }),
    };
  }

  const docs = google.docs({ version: 'v1', auth: oauth2Client });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    // Get the original document metadata
    const originalDocMetadata = await drive.files.get({
      fileId: originalDocId,
      fields: 'createdTime,owners'
    });

    const createdTime = new Date(originalDocMetadata.data.createdTime).toLocaleString();
    const creatorUsername = originalDocMetadata.data.owners[0].displayName;

    // Get the document to check for existing headers and footers
    const document = await docs.documents.get({ documentId: documentId });
    
    let existingHeaders = document.data.headers || {};
    let existingFooters = document.data.footers || {};

    const requests = [];

    // Check if header exists, if not, create one
    if (Object.keys(existingHeaders).length === 0) {
      requests.push({
        createHeader: {
          type: 'DEFAULT',
        }
      });
    }

    // Check if footer exists, if not, create one
    if (Object.keys(existingFooters).length === 0) {
      requests.push({
        createFooter: {
          type: 'DEFAULT',
        }
      });
    }

    // If we need to create headers or footers, do it now
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: { requests }
      });

      // Refresh the document data after creating headers/footers
      const updatedDocument = await docs.documents.get({ documentId: documentId });
      existingHeaders = updatedDocument.data.headers || {};
      existingFooters = updatedDocument.data.footers || {};
    }

    // Get the first header and footer IDs
    const headerId = Object.values(existingHeaders)[0]?.headerId;
    const footerId = Object.values(existingFooters)[0]?.footerId;

    if (!headerId || !footerId) {
      throw new Error('Failed to find header or footer ID');
    }

    // Prepare requests to update header and footer content
    const updateRequests = [
      {
        insertText: {
          location: {
            segmentId: headerId,
            index: 0
          },
          text: `Created for ${workgroup}, by ${creatorUsername}, on ${createdTime}
Doc owned by - ${ownerUsername}\n`
        }
      },
      {
        insertText: {
          location: {
            segmentId: footerId,
            index: 0
          },
          text: `Original Document ID: ${originalDocId}\n`
        }
      }
    ];

    // Update header and footer content
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: updateRequests
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Headers and footers updated successfully' }),
    };
  } catch (error) {
    console.error('Error updating headers and footers:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update headers and footers', details: error.message }),
    };
  }
};