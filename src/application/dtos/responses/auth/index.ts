export * from './auth.response';

import { AuthTokenResponse, OtpRequiredResponse, EmailVerificationRequiredResponse } from './auth.response';

// Union type for authentication responses
export type AuthResponse = AuthTokenResponse | OtpRequiredResponse | EmailVerificationRequiredResponse;
