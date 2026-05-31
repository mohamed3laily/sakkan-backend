export interface AuthenticatedUser {
  id: number;
  phone: string;
  verified: boolean;
  sessionId: number;
}
