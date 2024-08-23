import axios from 'axios';
import { i18n } from './i18n.js';
import { useUserStore } from 'src/stores/user';
import notify from 'src/utils/notify.js'
// 介紹: 成功就不說
// 如果失敗，會用handleError 翻譯，取出標準格式throw, 所以操作的一樣要有catch

const t = i18n.global.t;

async function handleApiResponse(response) {
  if (!response) {
    const data = createErrorResponse(t('axios.responseNotFound'), 'handleApiResponse !response')
    await notify(data)
    return data
  }
  const { data } = response;
  // 如果前端是200 &&!data.success 應該是有其他考量，交給前端處理
  // if (!data.success) {
  //   // Throw an error when the response object has a success property set to false
  //   throw new Error('Response failed', data || 'responseFailed');
  // } else {
  //   return data;
  // }
  return data
}

// 只要是後端傳非2xx 都是錯誤，都應該要直接給文字訊息，而且會廣播(notify)
async function handleApiError(error) {
  const result = processApiError(error)
  await notify(result)
  return result;
}

// 多了登錄相關判斷處理
async function handleApiAuthError(error) {
  const { response, config } = error;
  if (!response) {
    const data = createErrorResponse(t('axios.responseNotFound'), "handleApiAuthError 沒 response ")
    await notify(data)
    return data
  }
  if (response.status === 426) {
    const users = useUserStore();
    await extendToken(users, config);
    // 成功後重打原本request (應要跟handleApiResponse 依樣邏輯)
    const secondResponse = await axios(config);
    return handleApiResponse(secondResponse)
    // 後端非過期等jwt驗證錯,直接登出
  } else if (response.status === 401) {
    users.clearLocalStorageAndCookie()
    await notify({ success: false, message: { title: "loginExpired" } })
    // 透過這裡通知登入過期的，用下面方法避免丟error觸發其他頁面的自動notify error
    return { success: false }
  }
  return await handleApiError(error)
}

const api = axios.create({
  baseURL: process.env.SERVER_URL,
  withCredentials: true,
  headers: import.meta.env.SSR ? { Origin: 'https://knowforum.com' } : {}
});

const apiAuth = axios.create({
  baseURL: process.env.SERVER_URL,
  withCredentials: true,
  headers: import.meta.env.SSR ? { Origin: 'https://knowforum.com' } : {}
});

apiAuth.interceptors.request.use((config) => {
  const users = useUserStore();
  config.headers.authorization = `Bearer ${users.token}`;
  return config;
});

api.interceptors.response.use(handleApiResponse, handleApiError);
apiAuth.interceptors.response.use(handleApiResponse, handleApiAuthError);

export { api, apiAuth };


//
function processApiError(error) {
  if (error.code === "ERR_NETWORK") { return createErrorResponse('axios.networkErr') }
  return error?.response?.data || createErrorResponse('axios.resFormatErr');
}

function createErrorResponse(errorMessage, extraMessage) {
  return {
    success: false,
    message: errorMessage,
    log: extraMessage || undefined
  };
}

//
function log(message) {
  console.log(message);
}
async function extendToken(users, config) {
  log("extend token");
  const { data } = await apiAuth.get('/user/extend', {});
  users.extendToken(data.token)
  config.headers.authorization = `Bearer ${data.token}`;
  log("extend token end");
}
