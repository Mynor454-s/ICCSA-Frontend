import axios from "axios";

const API_URL = "http://localhost:3000/api/users";

// Función para obtener el token del sessionStorage
const getAuthHeader = () => {
  const token = sessionStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getUsers = async () => {
  const res = await axios.get(API_URL, getAuthHeader());
  return res.data;
};

export const createUser = async (user: any) => {
  const res = await axios.post(API_URL, user, getAuthHeader());
  return res.data;
};

export const updateUser = async (id: number, user: any) => {
  const res = await axios.put(`${API_URL}/${id}`, user, getAuthHeader());
  return res.data;
};

export const deleteUser = async (id: number) => {
  const res = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return res.data;
};
