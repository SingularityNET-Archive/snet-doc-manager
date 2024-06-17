// utils/getDocumentComments.js
import { google } from 'googleapis';
import { getOAuth2Client } from '../utils/oauth2Client';

const oauth2Client = getOAuth2Client();

export async function getDocumentComments(doc) {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
    try {
      const commentsResponse = await drive.comments.list({
        fileId: doc.google_id,
        fields: 'comments(id,author,content,quotedFileContent,anchor,replies(author,content))',
      });
  
      const commentsData = commentsResponse.data.comments;
  
      //console.log('Document ID:', doc.google_id);
      //console.log('Comments Data:', commentsData);
  
      let commentsText = '';
  
      commentsData.forEach((comment) => {
        const resolvedReply = comment.replies.find((reply) => reply.content === '');
        const isResolved = resolvedReply !== undefined;
  
        if (comment.quotedFileContent) {
          commentsText += `#### Context - ${comment.quotedFileContent.value}\n`;
        }
  
        commentsText += `> * ${comment.author.displayName}: ${comment.content}`;
  
        if (isResolved) {
          commentsText += ` (Resolved by ${resolvedReply.author.displayName})\n`;
        } else {
          commentsText += '\n';
        }

        comment.replies.forEach((reply) => {
            if (reply.content !== '') {
              commentsText += `>   - ${reply.author.displayName}: ${reply.content}\n`;
            }
          });
  
        commentsText += '> \n';
      });
  
      return commentsText;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        return ''; // Return an empty string or any other default value you prefer
      } else {
        console.error('Error retrieving document comments:', error);
        throw error; // Rethrow other errors
      }
    }
  }