const UseQs = (body)=>{
    let bodyType = Object.prototype.toString.call(body)
    if (bodyType !== "[object Object]") {
        console.warn('body 参数不是对象');
        return
    }
    let arr = []
    Object.keys(body).forEach(key=>{
        arr.push(key+'='+body[key])
    })
    return '?'+arr.join('&')
}

export default UseQs