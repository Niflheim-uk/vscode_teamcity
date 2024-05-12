import { getTCRootProject } from "./restApiInterface";
import { TeamCityItem } from "./teamCityItem";


export class TeamCityModel {
  private rootProject:TeamCityItem|undefined;
  constructor() {
  }

  public async createModel():Promise<void> {
    const xml = await getTCRootProject();
    if(xml) {
      this.rootProject = new TeamCityItem(xml, null);
      await this.rootProject.getChildren();
    }
  }
  public async getRootProject():Promise<TeamCityItem|undefined> {
    await this.createModel();
    return this.rootProject;
  }
}