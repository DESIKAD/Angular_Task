import { Component } from '@angular/core';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent {

  // x:any = 12;
  // y:any = 24;

  // sum = this.x+this.y



  skillList:any[]=[];
  
CheckedItem(event:any,skillName:string ){
 
  let isChecked = event.target.checked;

  if(isChecked){

    this.skillList.push(skillName)

  }

  else{
    this.skillList= this.skillList.filter(skill => skill !== skillName)
  }

  console.log(this.skillList);
  
}
}


let arr:any[]=[{name:"jagan",age:25},{name:"desika",age:22},{name:"Arun",age:23}];
let allValues:any[] =[]
for(let i of arr){
    let justvalues = Object.values(i)
    allValues.push(...justvalues)

    // let data = arr.flatMap(i=>Object.values(i))
    // console.log(data)

}
console.log(allValues);

