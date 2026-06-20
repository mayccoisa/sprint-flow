import { defineSecret } from 'firebase-functions/params';

export const ATLASSIAN_ENC_KEY = defineSecret('ATLASSIAN_ENC_KEY');

export const ALL_ATLASSIAN_SECRETS = [ATLASSIAN_ENC_KEY];
