import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { buildAxiosClient } from './atlassian/client';
import {
  deleteConnection,
  writeConnection,
  type AtlassianConnection,
} from './atlassian/storage';
import { ATLASSIAN_ENC_KEY } from './atlassian/secrets';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL_REGEX = /^https?:\/\/[a-zA-Z0-9-]+\.atlassian\.net\/?$/;

interface AtlassianCredentialsInput {
  email: string;
  apiToken: string;
  siteUrl: string;
}

export const setAtlassianCredentials = onCall<AtlassianCredentialsInput>(
  { secrets: [ATLASSIAN_ENC_KEY] },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'login required');

    const email = (req.data?.email ?? '').trim().toLowerCase();
    const apiToken = (req.data?.apiToken ?? '').trim();
    const siteUrlRaw = (req.data?.siteUrl ?? '').trim().replace(/\/+$/, '');

    if (!EMAIL_REGEX.test(email)) {
      throw new HttpsError('invalid-argument', 'Email inválido.');
    }
    if (apiToken.length < 10) {
      throw new HttpsError('invalid-argument', 'API token muito curto. Gere em id.atlassian.com.');
    }
    if (!SITE_URL_REGEX.test(siteUrlRaw)) {
      throw new HttpsError(
        'invalid-argument',
        'URL do site inválida. Use o formato https://<empresa>.atlassian.net',
      );
    }

    const conn: AtlassianConnection = {
      email,
      apiToken,
      siteUrl: siteUrlRaw.replace(/\/+$/, ''),
    };

    const client = buildAxiosClient(conn);
    try {
      const resp = await client.jira.get('/rest/api/3/myself');
      const accountId = (resp.data as { accountId?: string }).accountId;
      if (!accountId) {
        throw new HttpsError('failed-precondition', 'Resposta inesperada do Jira.');
      }
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = e.response?.status;
      if (status === 401 || status === 403) {
        throw new HttpsError(
          'unauthenticated',
          'Credenciais rejeitadas pela Atlassian. Confira email, token e URL do site.',
        );
      }
      if (status === 404) {
        throw new HttpsError(
          'failed-precondition',
          'URL do site não encontrada. Confira https://<empresa>.atlassian.net.',
        );
      }
      throw new HttpsError(
        'unavailable',
        e.response?.data?.message ?? e.message ?? 'Não foi possível validar com a Atlassian.',
      );
    }

    await writeConnection(uid, conn);
    return { ok: true as const, siteUrl: conn.siteUrl, email: conn.email };
  },
);

export const disconnectAtlassian = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'login required');
  await deleteConnection(uid);
  return { ok: true as const };
});
