import { getAccessToken, getServerUrl } from "./settings";
import axios from 'axios';
import { env } from 'process';

export async function getRestApiGetResponse(restCall:string) {
  const serverURL = getServerUrl();
  const token = getAccessToken();
  if(serverURL && token) {
    env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		const response = await axios.get(serverURL+restCall, {headers: getHeadersForGet(token)});
    if (response.status === 200) {
      return response.data;
    }	else {
      console.log(response);
    }
  }
}
export async function getRestApiPostResponse(restCall:string, restPayload:any) {
  const serverURL = getServerUrl();
  const token = getAccessToken();
  if(serverURL && token) {
    env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		const response = await axios.post(serverURL+restCall, restPayload, {headers:getHeadersForPost(token)}); 
    if (response.status === 200) {
      return response.data;
    }	else {
      console.log(response);
    }
  }
}  
function getHeadersForPost(token:string) {
  return {
    'Accept':'application/json',      // eslint-disable-line @typescript-eslint/naming-convention
    'Content-Type':'application/json',// eslint-disable-line @typescript-eslint/naming-convention
    'Authorization':`Bearer ${token}` // eslint-disable-line @typescript-eslint/naming-convention
  };
}
function getHeadersForGet(token:string) {
  return {
    'Accept':'application/json',      // eslint-disable-line @typescript-eslint/naming-convention
    'Authorization':`Bearer ${token}` // eslint-disable-line @typescript-eslint/naming-convention
  };
}