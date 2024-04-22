import { google } from 'googleapis';

// Hardcoded document IDs for testing
const documents = [
  { google_id: '1uebknjv2fZVFEOnTZFex_u6IWQoddDLEZq9o_U01pU8' },
  { google_id: '14zKw5pn-YWzBHIsx8yrGlo27hoD3S98VjqgRO3glcKE' }
];

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI; // Redirect URI used in your OAuth consent screen
const refresh_token = process.env.GOOGLE_REFRESH_TOKEN; // Ensure this token has Drive API permissions

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

// Set credentials
oauth2Client.setCredentials({
  refresh_token: refresh_token,
});

const findTextByCommentAnchor = (docContent, anchor) => {
  // This is a very basic example that needs further development
  let text = '';
  const elements = docContent.body.content;

  const searchElements = (elements) => {
    for (const element of elements) {
      if (element.paragraph) {
        // Assuming direct matching for simplicity, but you'll need to parse `anchor`
        if (element.paragraph.elementId === anchor) {
          element.paragraph.elements.forEach((textElement) => {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          });
        }
      }
      // Add recursive search for other element types (tables, lists, etc.)
    }
  };

  searchElements(elements);
  return text.trim();
};


export const handler = async (event, context) => {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const docs = google.docs({ version: 'v1', auth: oauth2Client }); // Google Docs API client
  const results = [];

  for (let doc of documents) {
    try {
      const commentsResponse = await drive.comments.list({
        fileId: doc.google_id,
        fields: 'comments(anchor,content,author)',
      });

      // Fetch the document structure from Google Docs API
      const docContent = await docs.documents.get({
        documentId: doc.google_id,
      });

      const comments = commentsResponse.data.comments || [];
      const commentsWithText = await Promise.all(comments.map(async (comment) => {
        const text = findTextByCommentAnchor(docContent.data, comment.anchor);
        return { ...comment, relatedText: text };
      }));

      results.push({
        google_id: doc.google_id,
        comments: commentsWithText,
      });

    } catch (error) {
      console.error(`Error fetching details for document ${doc.google_id}:`, error);
      results.push({ google_id: doc.google_id, error: error.message });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};