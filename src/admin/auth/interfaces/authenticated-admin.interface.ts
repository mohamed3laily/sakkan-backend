import { AdminType } from 'src/modules/db/schemas/admins/admins';

export interface AuthenticatedAdmin {
  id: number;
  phone: string;
  name: string;
  type: AdminType;
  sessionId: number;
}
