const axios=require("axios"),cheerio=require("cheerio"),normalize=require("./normalize"),{lottieFilesUrl,queryModes}=require("./config.json"),parseAnchors=(a,b)=>b.reduce((b,c,d)=>{if(0===d)return{...b,...c.attribs,...normalize(a("lottie",c))[0].attribs};if(1===d){const a=c.children[0].attribs.src;return{...b,authorImage:a}}if(2===d){const a=c.children[0].children[0].data;return{...b,author:a}}return b},{}),toFriendlyResult=({title:a,speed:b,bg:c,href:d,path:e,author:f,authorImage:g})=>({title:a,url:d,anim:{uri:e,speed:b,backgroundColor:c},author:{name:f,image:g}}),parseBoxes=(a,b)=>b.reduce((b,c)=>[...b,parseAnchors(a,normalize(a("a",c)))],[]).map(toFriendlyResult);class Crawler{authenticate(){return axios({method:"get",url:`${lottieFilesUrl}`}).then(({headers:a,data:b})=>this.__extractSession(a,b)).then(({token:a,cookies:b})=>{this.__setToken(a),this.__setCookies(b)}).then(()=>this)}__extractSession(a,b){const c=cheerio.load(b);return{token:normalize(c("input")).reduce((a,b)=>{const{name:c,value:d}=b.attribs||{};return a||"_token"===c&&d},null),cookies:a["set-cookie"].reduce((a,b)=>`${a}${b};`,"")}}__setToken(a){this.token=a}__setCookies(a){this.cookies=a}__constructRequestHeaders(a){return{cookie:a}}__constructRequestUrl(a,b,c,d){return`${lottieFilesUrl}/${a}${b?`?page=${c||1}`:""}${"search"===a&&d?`&query=${d}`:""}`}crawl(a="recent",b={}){return Promise.resolve().then(()=>{if(0>Object.keys(queryModes).indexOf(a))return Promise.reject(new Error(`Unrecognized query mode! Please select one of ${queryModes}.`));const{paging:c,method:d}=queryModes[a];return axios({method:d||"get",url:this.__constructRequestUrl(a,c,b.page,b.query),data:{_token:this.token,query:b.query},headers:this.__constructRequestHeaders(this.cookies),withCredentials:!0}).then(({headers:a,data:b})=>{const{cookies:c,token:d}=this.__extractSession(a,b);return{headers:a,data:b}}).then(({headers:a,data:b})=>{const c=cheerio.load(b),d=parseBoxes(c,normalize(c(".lf-box")));return Promise.resolve(d)})})}}module.exports=Crawler;