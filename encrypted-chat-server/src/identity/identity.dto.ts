export type IdentityType = 'auth' | 'guest';

export interface Identity {
  userId: string;
  type: IdentityType;
  username: string;
}
