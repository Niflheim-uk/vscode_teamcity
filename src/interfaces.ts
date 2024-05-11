export interface PromptParameter {
  type:string;
  id:string;
  label:string;
  property:RestApiProperty;
  description?:string;
  value:string;
  selectData?:string[];
}
/****************************************/
/* TeamCity Rest Api                    */
/****************************************/
interface RestApiLinks {
  count:number;
  link:RestApiLink[];  
}
interface RestApiLink {
  type?:string;
  url?:string;
  relativeUrl?:string;
}

export interface RestApiProject {
  id:string;
  name:string;
  parentProjectId?:string;
  parentProjectName?:string;
  description?:string;
  href:string;
  links:RestApiLinks;
  parentProject?:RestApiProject;
  defaultTemplate?:RestApiBuildType;
  buildTypes?:RestApiBuildTypes;
  templates?:RestApiBuildTypes;
  projects?:RestApiProjects;
}
export interface RestApiProjects {
  count:number;
  href:string;
  nextHref:string;
  prevHref:string;
  project:RestApiProject[];
}

export interface RestApiBuildTypes {
  count:number;
  href:string;
  nextHref:string;
  prevHref:string;
  buildType:RestApiBuildType[];
}
export interface RestApiBuildType {
  id:string;
  name:string;
  templateFlag?:boolean;
  paused?:boolean;
  description?:string;
  projectName?:string;
  projectId?:string;
  href:string;
  links:RestApiLinks;
  project?:RestApiProject;
  templates?:RestApiBuildTypes;
  template?:RestApiBuildType;
  settings?:RestApiProperties;
  parameters?:RestApiProperties;
  steps?:RestApiSteps;
}
export interface RestApiProperties {
  count:number;
  href:string;
  property:RestApiProperty[];
}
export interface RestApiProperty {
  name:string;
  value:string;
  inherited:boolean;
  type:RestApiType;
}
export interface RestApiType {
  rawValue:string;
}
export interface RestApiTypeDetail {
  description?:string;
  label?:string;
  validationMode?:string;
  display?:string;
  readOnly?:boolean; 
  regexp?:string;
  selectData?:string[];
}
export interface RestApiBuild {
  buildTypeId?:string;
  finishOnAgentDate?:string;
  href?:string;
  id?:string;
  number?:string;
  state?:string;
  status?:string;
  webUrl?:string;
  statusText?:string;
}
export enum RestApiBuildState {
  queued = "queued",
  finished = "finished",
  running = "running",
  deleted = "deleted",
  unknown = "unknown"
}
export enum RestApiBuildStatus {
  success = "SUCCESS",
  failure = "FAILURE",
  unknown = "Unknown"
}
export interface RestApiBuilds {
  count:string;
  href:string;
  nextHref?:string;
  prevHref?:string;
  build:RestApiBuild[];
}
export interface RestApiStep {
  id:string;
  name:string;
  type:string;
  disabled?:boolean;
  inherited?:boolean;
  href:string;
  properties:RestApiProperties;
}
export interface RestApiSteps {
  count:number;
  step:RestApiStep[];
}