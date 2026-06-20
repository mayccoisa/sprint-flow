import axios, { type AxiosInstance } from 'axios';
import { readConnection, type AtlassianConnection } from './storage';

export class AtlassianNotConnectedError extends Error {
  code = 'ATLASSIAN_NOT_CONNECTED' as const;
  constructor() {
    super('Usuário não conectou a conta Atlassian');
  }
}

export interface AtlassianClient {
  siteUrl: string;
  jira: AxiosInstance;
}

export function buildAxiosClient(conn: AtlassianConnection): AtlassianClient {
  const basic = Buffer.from(`${conn.email}:${conn.apiToken}`).toString('base64');
  const headers = {
    Authorization: `Basic ${basic}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const jira = axios.create({ baseURL: conn.siteUrl, headers, timeout: 15_000 });
  return { siteUrl: conn.siteUrl, jira };
}

export async function getAtlassianClient(uid: string): Promise<AtlassianClient> {
  const conn = await readConnection(uid);
  if (!conn) throw new AtlassianNotConnectedError();
  return buildAxiosClient(conn);
}
