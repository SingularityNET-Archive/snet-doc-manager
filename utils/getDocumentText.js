// utils/getDocumentText.js
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

export async function getDocumentText(doc) {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    try {
      const response = await docs.documents.get({
        documentId: doc.google_id,
      });
      const content = response.data.body.content;
      let docText = '';
      let isTitleFound = false;
      content.forEach((element) => {
        if (element.paragraph) {
          let headingLevel = 0;
          if (element.paragraph.paragraphStyle && element.paragraph.paragraphStyle.namedStyleType) {
            const styleType = element.paragraph.paragraphStyle.namedStyleType;
            if (styleType === 'TITLE' && !isTitleFound) {
              headingLevel = 1;
              isTitleFound = true;
            } else if (styleType === 'HEADING_1') {
              headingLevel = 1;
            } else if (styleType === 'HEADING_2') {
              headingLevel = 2;
            } else if (styleType === 'HEADING_3') {
              headingLevel = 3;
            } else if (styleType === 'HEADING_4') {
              headingLevel = 4;
            } else if (styleType === 'HEADING_5') {
              headingLevel = 5;
            } else if (styleType === 'HEADING_6') {
              headingLevel = 6;
            }
          }
          let paragraphText = '';
          let isBold = false;
          element.paragraph.elements.forEach((el) => {
            if (el.textRun && el.textRun.content) {
              const text = el.textRun.content.replace(/\n/g, '').trim();
              const style = el.textRun.textStyle;
              if (style && style.bold && headingLevel === 0) {
                if (!isBold) {
                  paragraphText += '**';
                  isBold = true;
                }
                paragraphText += text;
                if (text.endsWith(' ')) {
                  paragraphText += '** ';
                  isBold = false;
                }
              } else {
                if (isBold) {
                  paragraphText += '** ';
                  isBold = false;
                }
                paragraphText += text + ' ';
              }
            }
          });
          if (isBold) {
            paragraphText += '**';
          }
          if (headingLevel > 0 && paragraphText.trim() !== '') {
            docText += `${'#'.repeat(headingLevel)} ${paragraphText.trim()}\n`;
          } else {
            docText += paragraphText.trim() + '\n';
          }
          docText += '\n';
        }
      });
      return docText;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        return ''; // Return an empty string or any other default value you prefer
      } else {
        console.error('Error retrieving document text:', error);
        throw error; // Rethrow other errors
      }
    }
  }