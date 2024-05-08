import { getRestApiGetResponse, getRestApiPostResponse } from "./restApiLowLevel";
import { PromptParameter, RestApiBuildType, RestApiProject, RestApiProjects, RestApiProperties, RestApiProperty, RestApiTypeBuilds, RestApiTypeDetail } from "./interfaces";

export enum BuildStatus {
  success,
  unknown,
  failure
}

export async function getTCRootProject(): Promise<RestApiProject | undefined> {
  const projectsXml:RestApiProjects = await getRestApiGetResponse("/app/rest/projects");
  if(projectsXml && (projectsXml.count > 0)) {
    return await getTCProject(projectsXml.project[0].id);
  }
}

export async function getTCProject(id:string): Promise<RestApiProject | undefined> {
  return await getRestApiGetResponse(`/app/rest/project/id:${id}`);
}
export async function getTCBuildType(buildId:string):Promise<RestApiBuildType | undefined> {
  return await getRestApiGetResponse(`/app/rest/buildTypes/id:${buildId}`);
}

export async function getTCBuildStatus(buildId:string): Promise<BuildStatus> {
  const call = `/app/rest/builds/?locator=buildType:${buildId},count:1`;
  const buildsXml:RestApiTypeBuilds = await getRestApiGetResponse(call);
  if(buildsXml && buildsXml.build && buildsXml.build[0] && (buildsXml.build[0].state === "finished")) {
    if(buildsXml.build[0].status === "SUCCESS") {
      return BuildStatus.success;
    } else {
      return BuildStatus.failure;
    }    
  }
  return BuildStatus.unknown;
}
export function setTCBuildQueue(buildConfig:RestApiBuildType):void {
  var promptParameters:PromptParameter[]|undefined;
  const buildId = buildConfig.id;
  if(buildConfig.parameters && buildConfig.parameters.count > 0) {
    promptParameters = getPromptParameters(buildConfig.parameters);
    // const prompt = new Prompt();
    // prompt.createPrompt(buildId, promptParameters);
  } else {
    const payload = {"buildType" : {"id": buildId}};
    getRestApiPostResponse("/app/rest/buildQueue",payload);
  }
}
export function setTCBuildQueueWithParameters(buildId:string, propertyData:RestApiProperty[]) {
  const payload = {"buildType" : {"id": buildId}, "properties": {"property" :propertyData}};
  getRestApiPostResponse("/app/rest/buildQueue",payload);
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



