import { getAccessToken, getServerUrl } from "./settings";
import axios from 'axios';
import { env } from 'process';

export async function getRestApiGetResponse(restCall:string) {
  const serverURL = getServerUrl();
  const token = getAccessToken();
  if(serverURL && token) {
    env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		const {data} = await axios.get(serverURL+restCall, {headers: getHeadersForGet(token)});
    if (data.status === 200) {
      console.log(data);
    }	else {
      return data;
    }
  }
}
export async function getRestApiPostResponse(restCall:string, restPayload:any) {
  const serverURL = getServerUrl();
  const token = getAccessToken();
  if(serverURL && token) {
    env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		const data = await axios.post(serverURL+restCall, restPayload, {headers:getHeadersForPost(token)}); 
    if (data.status === 200) {
      console.log(data);
    }	else {
      return data;
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