const vscode = acquireVsCodeApi();

function addParameter(element, propertyList) {
  const property = {
    name:element.dataset.propertyname,
    value:element.value
  };
  if(propertyList) {
    propertyList.push(property);
  } else {
    propertyList = [property];
  }
  return propertyList;
}
function onRun() {
  var propertyList;
  const textAreas = document.getElementsByTagName('textarea');
  const passwords = document.getElementsByTagName('input');
  const selections = document.getElementsByTagName('select');
  for(let element of textAreas) {
    propertyList = addParameter(element, propertyList);
  }
  for(let element of passwords) {
    propertyList = addParameter(element, propertyList);
  }
  for(let element of selections) {
    propertyList = addParameter(element, propertyList);
  }
  vscode.postMessage({command: 'buildWithParameters', propertyList});
}
function onCancel() {
  vscode.postMessage({command: 'cancelBuild'});
}
