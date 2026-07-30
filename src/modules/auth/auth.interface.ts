export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  gender: string;
  dateOfBirth: string;
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
