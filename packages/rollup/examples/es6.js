class Clas{
    #id=12;
    count=1;
    static getInstance(){

    }
    onClick=()=>{

    }
    print(){

    }
}
let data={age:1,item2:'12',item3:"4"}
let {age,...items}=data
function get(age,...rest){
    let [first,...last]=[age,...rest,1,2,3,4]
    return [first,...last]
}
export {
    get,
    Clas,
    age,
    items
}