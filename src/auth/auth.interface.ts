export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
