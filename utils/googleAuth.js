import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'];
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

export function getGoogleAuth() {
  const auth = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: SCOPES,
  });
  return auth;
}