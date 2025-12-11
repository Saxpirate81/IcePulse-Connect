// User roles matching existing ice-pulse app structure
export type UserRole = 'Admin' | 'Coach' | 'Parent' | 'Player';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  playerId?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: { userRole: UserRole };
};

export type AdminTabParamList = {
  Log: undefined;
  Video: undefined;
  Stats: undefined;
  Chat: undefined;
  Profile: undefined;
};

