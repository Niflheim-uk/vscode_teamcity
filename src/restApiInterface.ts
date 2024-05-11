import { getRestApiGetResponse, getRestApiPostResponse } from "./restApiLowLevel";
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

export enum BuildStatus {
  success,
  unknown,
  failure,
  inprogress,
  queued,
}

export async function getTCRootProject(): Promise<RestApiProject | undefined> {
  console.log(`Called getTCRootProject`);
  const projectsXml:RestApiProjects = await getRestApiGetResponse("/app/rest/projects");
  var root=undefined;
  if(projectsXml && (projectsXml.count > 0)) {
    root = await getTCProject(projectsXml.project[0].id);
  }
  return root;
}

export async function getTCProject(id:string): Promise<RestApiProject | undefined> {
  console.log(`Called getTCProject: ${id}`);
  return await getRestApiGetResponse(`/app/rest/projects/id:${id}`);
}
export async function getTCBuildType(buildId:string):Promise<RestApiBuildType | undefined> {
  console.log(`Called getTCBuildType: ${buildId}`);
  return await getRestApiGetResponse(`/app/rest/buildTypes/id:${buildId}`);
}
export async function getTCBuild(id:string): Promise<RestApiBuild |undefined> {
  console.log(`Called getTCBuild`);
  return await getRestApiGetResponse(`/app/rest/builds/id:${id}`);
}
export async function getTCRecentBuilds(buildId:string): Promise<RestApiBuild[]> {
  console.log(`Called getTCRecentBuilds: ${buildId}`);
  const numBuilds = 5;
  const call = `/app/rest/builds/?locator=buildType:${buildId},count:${numBuilds},canceled:any,failedToStart:any,state:`;
  const xml1 =  await getRestApiGetResponse(`${call}queued`);
  const xml2 =  await getRestApiGetResponse(`${call}running`);
  const xml3 =  await getRestApiGetResponse(`${call}finished`);
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
  for (let i = 0; i < builds.length; i++) {
    const detail = await getRestApiGetResponse(`/app/rest/builds/id:${builds[i].id}`);
    if(detail && detail.statusText) {
      builds[i].statusText = detail.statusText;
    }
  }
  return builds;
}
export async function setTCBuildQueue(buildConfig:RestApiBuildType): Promise<RestApiBuild|undefined> {
  console.log(`Called setTCBuildQueue: ${buildConfig.id}`);
  var build = undefined;
  var promptParameters:PromptParameter[]|undefined;
  if(buildConfig.parameters && buildConfig.parameters.count > 0) {
    promptParameters = getPromptParameters(buildConfig.parameters);
    // const prompt = new Prompt();
    // prompt.createPrompt(buildId, promptParameters);
  } else {
    const payload = {"buildType" : {"id": buildConfig.id}};
    build = await getRestApiPostResponse("/app/rest/buildQueue",payload);
  }
  return build;
}
export async function setTCBuildQueueWithParameters(buildId:string, propertyData:RestApiProperty[]) {
  console.log(`Called setTCBuildQueueWithParameters: ${buildId}`);
  const payload = {"buildType" : {"id": buildId}, "properties": {"property" :propertyData}};
  return await getRestApiPostResponse("/app/rest/buildQueue",payload);
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



