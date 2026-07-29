export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  contactInfo?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
