export const isLoggedIn = (): boolean => {
  return localStorage.getItem("token") ? true : false;
};

export async function logout(): Promise<void> {
  await fetch("https://groshare.dariostrm.dev/api/v1/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  localStorage.removeItem("token");
  window.location.href = "/";
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem("token", token);
};
