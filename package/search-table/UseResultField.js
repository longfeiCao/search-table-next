const UseResultField = (data,field)=>{
    if (!field) {
        return data
    }
    
    let dataType = Object.prototype.toString.call(data)
    let fieldType = Object.prototype.toString.call(field)
    let res = {}
    if (dataType !== "[object Object]") {
        console.warn('data 数据类型不是一个对象');
        return
    }
   
   if (fieldType == "[object String]") {
       let arr = field.split('.')
       if (arr.length > 0) {
           for (let index = 0; index < arr.length; index++) {
                const key = arr[index];
                if (!data[key]) {
                    console.error(`field ${key} 不存在`);
                    break;
                }
                data = data[key]
           }
           return data
       }
   }else{
       console.warn("result field props String please");
   }
}

export default UseResultField