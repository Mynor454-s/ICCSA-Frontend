import axios from "axios";

export interface Role {
  id: number;
  name: string;
  description: string;
}

const API_URL = "http://localhost:3000/api/roles";

export const getRoles = async (): Promise<Role[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};
