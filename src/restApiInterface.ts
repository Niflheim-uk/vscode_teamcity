import { getAxiosGetResponse, getAxiosPostResponse } from "./axiosInterface";
import { 
  PromptParameter, 
  RestApiBuildType, 
  RestApiProject, 
  RestApiProjects, 
  RestApiProperties, 
  RestApiProperty, 
  RestApiBuild, 
  RestApiBuilds, 
  RestApiTypeDetail 
} from "./interfaces";
import { Prompt } from "./prompt";
import { TeamCityItem } from "./teamCityItem";

export enum BuildStatus {
  success,
  unknown,
  failure,
  inprogress,
  queued,
}

export async function getTCRootProject(): Promise<RestApiProject | undefined> {
  console.log(`Called getTCRootProject`);
  const projectsXml:RestApiProjects = await getAxiosGetResponse("/app/rest/projects");
  var root=undefined;
  if(projectsXml && (projectsXml.count > 0)) {
    root = await getTCProject(projectsXml.project[0].id);
  }
  return root;
}

export async function getTCProject(id:string): Promise<RestApiProject | undefined> {
  console.log(`Called getTCProject: ${id}`);
  return await getAxiosGetResponse(`/app/rest/projects/id:${id}`);
}
export async function getTCBuildType(buildId:string):Promise<RestApiBuildType | undefined> {
  console.log(`Called getTCBuildType: ${buildId}`);
  return await getAxiosGetResponse(`/app/rest/buildTypes/id:${buildId}`);
}
export async function getTCBuild(id:string): Promise<RestApiBuild |undefined> {
  console.log(`Called getTCBuild`);
  return await getAxiosGetResponse(`/app/rest/builds/id:${id}`);
}
export async function getTCBuildLog(buildId:string):Promise<string> {
  console.log(`Called getTCBuildLog`);
  return await getAxiosGetResponse(`/downloadBuildLog.html?buildId=${buildId}&plain=true`);
}
export async function getTCRecentBuilds(buildId:string): Promise<RestApiBuild[]> {
  console.log(`Called getTCRecentBuilds: ${buildId}`);
  const numBuilds = 5;
  const call = `/app/rest/builds/?locator=buildType:${buildId},count:${numBuilds},canceled:any,failedToStart:any,state:`;
  const xml1 =  await getAxiosGetResponse(`${call}queued`);
  const xml2 =  await getAxiosGetResponse(`${call}running`);
  const xml3 =  await getAxiosGetResponse(`${call}finished`);
  var builds:RestApiBuild[] = [];
  if(xml1) {
    const typeBuilds:RestApiBuilds = xml1;
    for(let i=0; i < +typeBuilds.count; i++) {
      builds.push(typeBuilds.build[i]);
    }
  }
  if(xml2) {
    const typeBuilds:RestApiBuilds = xml2;
    for(let i=0; i < +typeBuilds.count; i++) {
      builds.push(typeBuilds.build[i]);
    }
  }
  if(xml3) {
    const typeBuilds:RestApiBuilds = xml3;
    for(let i=0; i < +typeBuilds.count; i++) {
      builds.push(typeBuilds.build[i]);
    }
  }
  while(builds.length > numBuilds) {
    builds.pop();
  }
  console.log(builds[0].state);
  for (let i = 0; i < builds.length; i++) {
    const detail = await getAxiosGetResponse(`/app/rest/builds/id:${builds[i].id}`);
    if(detail && detail.statusText) {
      builds[i] = detail;
    }
  }
  console.log(builds[0].state, builds[0].statusText);
  return builds;
}
export async function setTCBuildQueue(buildConfig:RestApiBuildType, buildItem:TeamCityItem) {
  console.log(`Called setTCBuildQueue: ${buildConfig.id}`);
  var promptParameters:PromptParameter[]|undefined;
  if(buildConfig.parameters && buildConfig.parameters.count > 0) {
    promptParameters = getPromptParameters(buildConfig.parameters);
    const prompt = new Prompt(buildItem);
    prompt.createPrompt(buildConfig.id, promptParameters);
  } else {
    const payload = {"buildType" : {"id": buildConfig.id}};
    await postBuildQueue(payload, buildItem);
  }
}
export async function setTCBuildQueueWithParameters(buildId:string, propertyData:RestApiProperty[], buildItem:TeamCityItem) {
  console.log(`Called setTCBuildQueueWithParameters: ${buildId}`);
  const payload = {"buildType" : {"id": buildId}, "properties": {"property" :propertyData}};
  await postBuildQueue(payload, buildItem);
}
async function postBuildQueue(payload:any, buildItem:TeamCityItem) {
  const build = await getAxiosPostResponse("/app/rest/buildQueue",payload);
  if(build) {
    await buildItem.getChildren();
  }

}

function getPromptParameters(buildParams:RestApiProperties):PromptParameter[] {
  var promptParameters:PromptParameter[]=[];
  for (let index = 0; index < buildParams.count; index++) {
    const property = buildParams.property[index];
    const promptParameter = getPromptParameter(property);
    if(promptParameter) {
      promptParameters.push(promptParameter);
    }
  }
  return promptParameters;
}
function getPromptParameter(prop:RestApiProperty):PromptParameter|undefined {
  if(prop.type) {
    const [type, typeDetail] = extractTypeProperty(prop.type.rawValue);
    if(typeDetail.display === 'prompt') {
      if(typeDetail.label === undefined) {
        typeDetail.label = prop.name;
      }
      const promptParameter:PromptParameter = {
        type:type,
        id:prop.name,
        label:typeDetail.label,
        property:prop,
        description:typeDetail.description,
        value:prop.value,
        selectData:typeDetail.selectData
      };
      return promptParameter;
    }
  }
  return undefined;
}
function extractTypeProperty(rawValue:string):[string,RestApiTypeDetail] {
  let typeDetail:RestApiTypeDetail = {};
  // first word of rawValue is the type
  const type = rawValue.split(' ')[0];
  rawValue = rawValue.slice(type.length+1);
  const matches = rawValue.match(/([^=]+)=\'([^\']+)\'/g);
  if(matches) {
    for(let index = 0; index < matches.length; index++) {
      const matchValue = matches[index];
      const key = matchValue.split('=')[0].trim();
      const value = matchValue.split('=')[1].slice(1,-1);
      typeDetail = populateTypeDetail(typeDetail, key, value);
    }
  }  
  return [type, typeDetail];
}
function populateTypeDetail(detail:RestApiTypeDetail, key:string, value:string) {
  switch(key) {
    case 'description':
      detail.description = value;
      break;
    case 'readOnly':
      detail.readOnly = false;
      if(value === 'true') {
        detail.readOnly = true;
      }
      break;
    case 'validationMode':
      detail.validationMode = value;
      break;
    case 'label':
      detail.label = value;
      break;
    case 'regexp':
      detail.regexp = value;
      break;
    case 'display':
      detail.display = value;
      break;
    default:
      detail = populateTypeDetailAddSelectData(detail, key, value);
  }
  return detail;
}
function populateTypeDetailAddSelectData(detail:RestApiTypeDetail, key:string, value:string) {
  if(key.match(/data_/)) {
    if(Array.isArray(detail.selectData)) {
      detail.selectData.push(value);
    } else {
      detail.selectData = [value];
    }
  }
  return detail;
}



