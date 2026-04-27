export const isLoggedIn = (): boolean => {
  return localStorage.getItem("token") ? true : false;
};

export const logout = (event: Event): void => {
  event.preventDefault();
  localStorage.removeItem("token");
  window.location.href = "/";
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token);
};
