export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  stripeConnectAccountId?: string;
}
