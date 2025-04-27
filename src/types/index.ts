export interface User {
  id: string;
  login: string;
  email: string;
}

export interface Device {
  id: string;
  ip: string;
  deviceName: string;
  issuedAt: string;
  userId: string;
} 