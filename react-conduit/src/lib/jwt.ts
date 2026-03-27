export const getToken = () => localStorage.getItem('jwtToken');
export const saveToken = (token: string) => localStorage.setItem('jwtToken', token);
export const destroyToken = () => localStorage.removeItem('jwtToken');
