// 🌐 Active Production Provider: Set to 'azure' or 'alternative' (AWS EC2, Zeabur, Render, etc.)
const ACTIVE_PROD_PROVIDER = 'alternative'; 

const AZURE_URL = 'https://ridebook-api.azurewebsites.net';
const ALTERNATIVE_URL = 'http://13.61.73.142:5000'; // 🚀 Live AWS EC2 Server

const BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000' 
  : (ACTIVE_PROD_PROVIDER === 'azure' ? AZURE_URL : ALTERNATIVE_URL);

export const API_URL = BASE_URL;
export const SOCKET_URL = BASE_URL;