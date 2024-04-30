// getDocComments.js
import { supabaseAdmin } from '../../lib/supabaseClient';
import { google } from 'googleapis';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uris = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

export const handler = async (event, context) => {
  const { docs, test } = JSON.parse(event.body);
  const docComments = [];

  async function checkDocumentComments(doc) {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    let comments = {
      google_id: doc.google_id,
      comments: [],
      access_denied: false, // Add a flag to indicate access denied
    };

    try {
      const commentsResponse = await drive.comments.list({
        fileId: doc.google_id,
        fields: 'comments(id,author,content,quotedFileContent,anchor,replies(author,content))',
      });
      const commentsData = commentsResponse.data.comments;
      comments.comments = commentsData.map((comment) => {
        const selectedText = comment.quotedFileContent?.value || '';
        const replies = comment.replies?.map((reply) => ({
          author: reply.author,
          content: reply.content,
        }));
        return {
          id: comment.id,
          author: comment.author,
          content: comment.content,
          selectedText,
          anchor: comment.anchor,
          replies,
        };
      });
      return comments;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        comments.access_denied = true; // Set the access denied flag to true
        return comments;
      } else {
        console.error('Error:', error);
        throw error; // Rethrow other errors
      }
    }
  }

  for (const doc of docs) {
    const comments = await checkDocumentComments(doc);
    if (comments) {
      docComments.push(comments);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(docComments),
  };
};