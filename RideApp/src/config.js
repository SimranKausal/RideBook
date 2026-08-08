// 🌐 Active Production Provider: Set to 'render' or 'azure'
const ACTIVE_PROD_PROVIDER = 'render'; 

const AZURE_URL = 'https://ridebook-api.azurewebsites.net';
const RENDER_URL = 'https://ridebook-backend.onrender.com'; // ⚠️ Replace this with your actual Render Web Service URL

const BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000' 
  : (ACTIVE_PROD_PROVIDER === 'render' ? RENDER_URL : AZURE_URL);

export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL;

