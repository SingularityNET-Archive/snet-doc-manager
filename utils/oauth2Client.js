// utils/oauth2Client.js
import { google } from 'googleapis';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uris = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}