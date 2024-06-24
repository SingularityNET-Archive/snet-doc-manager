// ../netlify/functions/addHeadersAndFooters.js
import { google } from 'googleapis';
import { getOAuth2Client } from '../../utils/oauth2Client';

const oauth2Client = getOAuth2Client();

export const handler = async (event, context) => {
  const { documentId, formattedDate, originalDocId } = JSON.parse(event.body);

  if (!documentId || !formattedDate || !originalDocId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' }),
    };
  }

  const docs = google.docs({ version: 'v1', auth: oauth2Client });

  try {
    // Add header and footer
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          {
            createHeader: {
              type: 'DEFAULT',
            }
          },
          {
            createFooter: {
              type: 'DEFAULT',
            }
          }
        ]
      }
    });

    // Get the document to find the header and footer IDs
    const document = await docs.documents.get({ documentId: documentId });
    
    // Find the first header and footer
    const headerId = Object.values(document.data.headers || {})[0]?.headerId;
    const footerId = Object.values(document.data.footers || {})[0]?.footerId;

    if (!headerId || !footerId) {
      throw new Error('Failed to find header or footer ID');
    }

    // Insert text into header and footer
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                segmentId: headerId,
                index: 0
              },
              text: `Archive Copy created on ${formattedDate}\n`
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
        ]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Headers and footers added successfully' }),
    };
  } catch (error) {
    console.error('Error adding headers and footers:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add headers and footers', details: error.message }),
    };
  }
};