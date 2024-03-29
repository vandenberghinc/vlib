const libfs=require('fs');
const libfsextra=require('fs-extra');
const libos=require('os');
const libpath=require('path');
const libproc=require("child_process");
const vlib={};
String.prototype.first=function(){
return this[0];
};
String.prototype.last=function(){
return this[this.length-1];
};
String.prototype.first_non_whitespace=function(line_break=false){
for (let i=0;i<this.length;i++){
const char=this.charAt(i);
if (char!=" "&&char!="\t"&&(line_break==false||char!="\n")){
return char;
}
}
return null;
};
String.prototype.last_non_whitespace=function(line_break=false){
for (let i=this.length-1;i>=0;i--){
const char=this.charAt(i);
if (char!=" "&&char!="\t"&&(line_break==false||char!="\n")){
return char;
}
}
return null;
};
String.prototype.first_not_of=function(exclude=[],start_index=0){
for (let i=start_index;i<this.length;i++){
if (!exclude.includes(this.charAt(i))){
return this.charAt(i);
}
}
return null;
};
String.prototype.first_index_not_of=function(exclude=[],start_index=0){
for (let i=start_index;i<this.length;i++){
if (!exclude.includes(this.charAt(i))){
return i;
}
}
return null;
};
String.prototype.last_not_of=function(exclude=[],start_index=null){
if (start_index===null){
start_index=this.length-1;
}
for (let i=start_index;i>=0;i--){
if (!exclude.includes(this.charAt(i))){
return this.charAt(i);
}
}
return null;
};
String.prototype.last_index_not_of=function(exclude=[],start_index=null){
if (start_index===null){
start_index=this.length-1;
}
for (let i=start_index;i>=0;i--){
if (!exclude.includes(this.charAt(i))){
return i;
}
}
return null;
};
String.prototype.insert=function(index,substr){
let edited=this.substr(0,index);
edited+=substr;
edited+=this.substr(index);
return edited;
};
String.prototype.remove_indices=function(start,end){
let edited=this.substr(0,start);
edited+=this.substr(end);
return edited;
};
String.prototype.replace_indices=function(substr,start,end){
let edited=this.substr(0,start);
edited+=substr;
edited+=this.substr(end);
return edited;
};
String.prototype.eq_first=function(substr,start_index=0){
if (start_index+substr.length>this.length){
return false;
}
const end=start_index+substr.length;
let y=0;
for (let x=start_index;x<end;x++){
if (this.charAt(x)!=substr.charAt(y)){
return false;
}
++y;
}
return true;
}
String.prototype.eq_last=function(substr){
if (substr.length>this.length){
return false;
}
let y=0;
for (let x=this.length-substr.length;x<this.length;x++){
if (this.charAt(x)!=substr.charAt(y)){
return false;
}
++y;
}
return true;
}
String.prototype.ensure_last=function(ensure_last){
if (ensure_last.indexOf(this.charAt(this.length-1))===-1){
return this+ensure_last.charAt(0);
}
return this;
}
String.prototype.is_uppercase=function(allow_digits=false){
let uppercase="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
if (allow_digits){
uppercase+="0123456789";
}
for (let i=0;i<this.length;i++){
if (uppercase.indexOf(this.charAt(i))===-1){
return false;
}
}
return true;
}
String.prototype.capitalize_word=function(){
if ("abcdefghijklmnopqrstuvwxyz".includes(this.charAt(0))){
return this.charAt(0).toUpperCase()+this.substr(1);
}
return this;
}
String.prototype.capitalize_words=function(){
let batch="";
let capitalized="";
for (let i=0;i<this.length;i++){
const c=this.charAt(i);
if (c===" "||c==="\t"||c==="\n"){
capitalized+=batch.capitalize_word();
batch="";
capitalized+=c;
}else {
batch+=c;
}
}
capitalized+=batch.capitalize_word();
return capitalized;
}
String.prototype.drop=function(char){
const is_array=Array.isArray(char);
let dropped="";
for (let i=0;i<this.length;i++){
const c=this.charAt(i);
if (is_array){
if (char.includes(c)===false){
dropped+=c;
}
}else {
if (char!==c){
dropped+=c;
}
}
}
return dropped;
}
String.prototype.reverse=function(){
let reversed="";
for (let i=this.length-1;i>=0;i--){
reversed+=this.charAt(i);
}
return reversed;
}
String.random=function(length=32){
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let result="";
for (let i=0;i<length;i++){
result+=chars.charAt(Math.floor(Math.random()*chars.length));
}
return result;
}
String.prototype.includes_alphabetical_char=function(){
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
for (let i=0;i<this.length;i++){
if (chars.indexOf(this.charAt(i))!==-1){
return true;
}
}
return false;
}
String.prototype.includes_numeric_char=function(){
const chars="0123456789";
for (let i=0;i<this.length;i++){
if (chars.indexOf(this.charAt(i))!==-1){
return true;
}
}
return false;
}
String.prototype.includes_special_char=function(){
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
for (let i=0;i<this.length;i++){
if (chars.indexOf(this.charAt(i))===-1){
return true;
}
}
return false;
}
String.prototype.is_integer_string=function(){
const chars='0123456789';
for (let i=0;i<this.length;i++){
if (chars.indexOf(this.charAt(i))===-1){
return false;
}
}
return true;
}
String.prototype.is_floating_string=function(){
const chars='0123456789';
let decimal=false;
for (let i=0;i<this.length;i++){
const char=this.charAt(i);
if (char==='.'){
if (decimal){return false;}
decimal=true;
}else if (chars.indexOf(char)===-1){
return false;
}
}
return decimal;
}
String.prototype.is_numeric_string=function(info=false){
const chars='0123456789';
let decimal=false;
for (let i=0;i<this.length;i++){
const char=this.charAt(i);
if (char==='.'){
if (decimal){return false;}
decimal=true;
}else if (chars.indexOf(char)===-1){
if (info){
return {integer:false,floating:false};
}
return false;
}
}
if (info){
return {integer:decimal===false,floating:decimal===true};
}
return true;
}
String.prototype.unquote=function(){
if (
(this.charAt(0)==='"'&&this.charAt(this.length-1)==='"')||
(this.charAt(0)==="'"&&this.charAt(this.length-1)==="'")||
(this.charAt(0)==="`"&&this.charAt(this.length-1)==="`")
){
return this.slice(1,-1);
}
return this;
}
String.prototype.quote=function(){
if (
(this.charAt(0)==='"'&&this.charAt(this.length-1)==='"')||
(this.charAt(0)==="'"&&this.charAt(this.length-1)==="'")||
(this.charAt(0)==="`"&&this.charAt(this.length-1)==="`")
){
return this;
}
return `"${this}"`;
}
Array.prototype.append=Array.prototype.push;
Array.prototype.first=function(){
return this[0];
};
Array.prototype.last=function(){
return this[this.length-1];
};
Array.prototype.iterate=function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=start;i<end;i++){
const res=handler(this[i]);
if (res!=null&&!(res instanceof Promise)){
return res;
}
}
return null;
};
Array.prototype.iterate_async=function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
let promises=[];
for (let i=start;i<end;i++){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
promises.push(res);
}
}
return promises;
};
Array.prototype.iterate_async_await=async function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=start;i<end;i++){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
const pres=await res;
if (pres!=null){
return pres;
}
}
}
return null;
};
Array.prototype.iterate_append=function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
const items=[];
for (let i=start;i<end;i++){
items.append(handler(this[i],i));
}
return items;
};
Array.prototype.iterate_reversed=function(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=end-1;i>=start;i--){
const res=handler(this[i]);
if (res!=null&&!(res instanceof Promise)){
return res;
}
}
return null;
};
Array.prototype.iterate_reversed_async=function(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
let promises=[];
for (let i=end-1;i>=start;i--){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
promises.push(res);
}
}
return promises;
};
Array.prototype.iterate_reversed_async_await=async function(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=end-1;i>=start;i--){
const res=handler(this[i]);
if (res!=null&&res instanceof Promise){
const pres=await res;
if (pres!=null){
return pres;
}
}
}
return null;
};
Array.prototype.drop=function(item){
const dropped=new this.constructor();
for (let i=0;i<this.length;i++){
if (this[i]!=item){
dropped.push(this[i])
}
}
return dropped;
};
Array.prototype.drop_index=function(index){
const dropped=new this.constructor();
for (let i=0;i<this.length;i++){
if (i!=index){
dropped.push(this[i])
}
}
return dropped;
};
Array.prototype.drop_duplicates=function(){
return this.reduce((accumulator,val)=>{
if (!accumulator.includes(val)){
accumulator.push(val);
}
return accumulator;
},[]);
}
Array.prototype.limit_from_end=function(limit){
let limited=[];
if (this.length>limit){
for (let i=this.length-limit;i<this.length;i++){
limited.push(this[i]);
}
}else {
for (let i=0;i<this.length;i++){
limited.push(this[i]);
}
}
return limited;
}
Array.prototype.remove=function(item){
let removed=[];
this.iterate((i)=>{
if (i!=item){
removed.push(i);
}
})
return removed;
};
Array.prototype.eq=function(x=null,y=null){
const eq=(x,y)=>{
if (Array.isArray(x)){
if (
Array.isArray(y)===false||
x.length!==y.length
){
return false;
}
for (let i=0;i<x.length;i++){
if (typeof x[i]==="object"||typeof y[i]==="object"){
const result=eq(x[i],y[i]);
if (result===false){
return false;
}
}else if (x[i]!==y[i]){
return false;
}
}
return true;
}
else if (typeof x==="object"){
if (
typeof y!=="object"||
Array.isArray(y)
){
return false;
}
const x_keys=Object.keys(x);
const y_keys=Object.keys(y);
if (eq(x_keys,y_keys)===false){
return false;
}
for (let i=0;i<x_keys.length;i++){
if (typeof x[x_keys[i]]==="object"||typeof y[y_keys[i]]==="object"){
const result=eq(x[x_keys[i]],y[y_keys[i]]);
if (result===false){
return false;
}
}else if (x[x_keys[i]]!==y[y_keys[i]]){
return false;
}
}
return true;
}
else if (typeof x!==typeof y){return false;}
return x===y;
}
if (y==null){
y=x;
x=this;
}
return eq(x,y);
}
Object.expand=function(x,y){
const keys=Object.keys(y);
for (let i=0;i<keys.length;i++){
x[keys[i]]=y[keys[i]];
}
return x;
}
Object.eq=function(x,y){
const eq=(x,y)=>{
if (typeof x!==typeof y){return false;}
else if (x instanceof String){
return x.toString()===y.toString();
}
else if (Array.isArray(x)){
if (!Array.isArray(y)||x.length!==y.length){return false;}
for (let i=0;i<x.length;i++){
if (!eq(x[i],y[i])){
return false;
}
}
return true;
}
else if (x!=null&&typeof x==="object"){
const x_keys=Object.keys(x);
const y_keys=Object.keys(y);
if (x_keys.length!==y_keys.length){
return false;
}
for (const key of x_keys){
if (!y.hasOwnProperty(key)||!eq(x[key],y[key])){
return false;
}
}
return true;
}
else {
return x===y;
}
}
return eq(x,y);
}
Object.rename_keys=(obj={},rename=[["old","new"]],remove=[])=>{
remove.iterate((key)=>{
delete obj[key];
})
rename.iterate((key)=>{
obj[key[1]]=obj[key[0]];
delete obj[key[0]];
})
return obj;
}
Object.deep_copy=(obj)=>{
return vlib.utils.deep_copy(obj);
}
Object.delete_recursively=(obj,remove_keys=[])=>{
const clean=(obj)=>{
if (Array.isArray(obj)){
obj.iterate((item)=>{
if (Array.isArray(item)||(typeof item==="object"&&item!=null)){
clean(item);
}
})
}else {
Object.keys(obj).iterate((key)=>{
if (remove_keys.includes(key)){
delete obj[key];
}
else if (Array.isArray(obj[key])||(typeof obj[key]==="object"&&obj[key]!=null)){
clean(obj[key]);
}
})
}
}
clean(obj);
return obj;
}
vlib.utils={};
vlib.utils.edit_obj_keys=(obj={},rename=[["old","new"]],remove=[])=>{
remove.iterate((key)=>{
delete obj[key];
})
rename.iterate((key)=>{
obj[key[1]]=obj[key[0]];
delete obj[key[0]];
})
return obj;
}
vlib.utils.verify_params=function({params={},info={},check_unknown=false,parent="",error_prefix="",throw_err=true}){
const params_keys=Object.keys(params);
const info_keys=Object.keys(info);
const throw_err_h=(e,field)=>{
const invalid_fields={};
invalid_fields[field]=e;
if (throw_err===false){
return {error:e,invalid_fields};
}
const error=new Error(e);
let stack=error.stack.split("\n");
stack=[stack[0],...stack.slice(3)];
error.stack=stack.join("\n");
error.json={error:e,invalid_fields};
throw error;
}
for (let x=0;x<info_keys.length;x++){
let info_item;
if (typeof info[info_keys[x]]==="string"){
info[info_keys[x]]={type:info[info_keys[x]]};
info_item=info[info_keys[x]];
}else {
info_item=info[info_keys[x]];
}
if (info_item.def){
info_item.default=info_item.def;
delete info_item.def;
}
const type_error_str=(prefix=" of type ")=>{
let type_error_str="";
if (Array.isArray(info_item.type)){
type_error_str=prefix;
for (let i=0;i<info_item.type.length;i++){
type_error_str+=`"${info_item.type[i]}"`
if (i===info_item.type.length-2){
type_error_str+=" or "
}else if (i<info_item.type.length-2){
type_error_str+=", "
}
}
type_error_str;
}else {
type_error_str=`${prefix}"${info_item.type}"`
}
return type_error_str;
}
if (info_keys[x] in params===false){
if (info_item.default!==undefined){
params[info_keys[x]]=info_item.default;
}
else if (info_item.required!==false){
return throw_err_h(`${error_prefix}Parameter "${parent}${info_keys[x]}" should be a defined value${type_error_str()}.`,info_keys[x]);
}
}
else if (info_item.type){
const check_type=(type)=>{
switch (type){
case "null":
return params[info_keys[x]]==null;
case "array":
if (Array.isArray(params[info_keys[x]])===false){
return false;
}
return true;
case "object":
if (typeof params[info_keys[x]]!=="object"||params[info_keys[x]]==null){
return false;
}
if (info_item.attrs!==undefined){
let child_parent=`${parent}${info_keys[x]}.`;
try {
params[info_keys[x]]=vlib.utils.verify_params({params:params[info_keys[x]],info:info_item.attrs,check_unknown,parent:child_parent,error_prefix,throw_err:true});
}catch (e){
if (!throw_err&&e.json){
return e.json;
}else {
throw e;
}
}
}
if (info_item.attributes!==undefined){
let child_parent=`${parent}${info_keys[x]}.`;
try {
params[info_keys[x]]=vlib.utils.verify_params({params:params[info_keys[x]],info:info_item.attributes,check_unknown,parent:child_parent,error_prefix,throw_err:true});
}catch (e){
if (!throw_err&&e.json){
return e.json;
}else {
throw e;
}
}
}
return true;
default:
if (type!==typeof params[info_keys[x]]){
return false;
}
return true;
}
}
if (!(info_item.default==null&&params[info_keys[x]]==null)){
if (Array.isArray(info_item.type)){
let correct_type=false;
for (let i=0;i<info_item.type.length;i++){
const res=check_type(info_item.type[i]);
if (typeof res==="object"){
return res;
}
else if (res===true){
correct_type=true;
break;
}
}
if (correct_type===false){
const current_type=params[info_keys[x]]==null?"null":typeof params[info_keys[x]];
return throw_err_h(`${error_prefix}Parameter "${parent}${info_keys[x]}" has an invalid type "${current_type}", the valid type is ${type_error_str("")}.`,info_keys[x]);
}
}
else {
const res=check_type(info_item.type);
if (typeof res==="object"){
return res;
}
else if (res===false){
const current_type=params[info_keys[x]]==null?"null":typeof params[info_keys[x]];
return throw_err_h(`${error_prefix}Parameter "${parent}${info_keys[x]}" has an invalid type "${current_type}", the valid type is ${type_error_str("")}.`,info_keys[x]);
}
}
}
}
}
if (check_unknown){
for (let x=0;x<params_keys.length;x++){
if (params_keys[x] in info===false){
return throw_err_h(`${error_prefix}Parameter "${parent}${params_keys[x]}" is not a valid parameter.`,info_keys[x]);
}
}
}
if (throw_err===false){
return {error:null,invalid_fields:{},params};
}
return params;
}
vlib.utils.deep_copy=(obj)=>{
if (Array.isArray(obj)){
const copy=[];
obj.iterate((item)=>{
copy.append(vlib.utils.deep_copy(item));
})
return copy;
}
else if (obj!==null&&obj instanceof String){
return new String(obj.toString());
}
else if (obj!==null&&typeof obj==="object"){
const copy={};
const keys=Object.keys(obj);
const values=Object.values(obj);
for (let i=0;i<keys.length;i++){
copy[keys[i]]=vlib.utils.deep_copy(values[i]);
}
return copy;
}
else {
return obj;
}
}
vlib.Date=class D extends Date{
constructor(...args){
super(...args);
}
format(format){
let formatted="";
for (let i=0;i<format.length;i++){
if (format[i]==="%"){
switch (format[i+1]){
case '%':
formatted+="%";
++i;
break;
case 'a':
formatted+=new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(this);
++i;
break;
case 'A':
formatted+=new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(this);
++i;
break;
case 'b':
case 'h':
formatted+=new Intl.DateTimeFormat('en-US',{month:'short'}).format(this);
++i;
break;
case 'B':
formatted+=new Intl.DateTimeFormat('en-US',{month:'long'}).format(this);
++i;
break;
case 'C':
formatted+=Math.floor(this.getFullYear()/100);
++i;
break;
case 'd':
formatted+=String(this.getDate()).padStart(2,'0');
++i;
break;
case 'e':
formatted+=String(this.getDate());
++i;
break;
case 'D':
formatted+=this.format("%m/%d/%y");
++i;
break;
case 'F':
formatted+=this.format("%Y-%m-%d");
++i;
break;
case 'H':
formatted+=String(this.getHours()).padStart(2,'0');
++i;
break;
case 'I':
formatted+=String((this.getHours()%12)||12).padStart(2,'0');
++i;
break;
case 'j':
formatted+=String(
Math.floor((this-new Date(this.getFullYear(),0,0))/(86400*1000))
).padStart(3,'0');
++i;
break;
case 'k':
formatted+=String(this.getHours());
++i;
break;
case 'l':
formatted+=String((this.getHours()%12)||12);
++i;
break;
case 'm':
formatted+=String(this.getMonth()+1).padStart(2,'0');
++i;
break;
case 'M':
formatted+=String(this.getMinutes()).padStart(2,'0');
++i;
break;
case 'n':
formatted+="\n";
++i;
break;
case 'N':
formatted+=String(this.getMilliseconds()).padStart(Number(format[i+2])||3,'0');
i+=2;
break;
case 'p':
formatted+=new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:true }).format(this);
++i;
break;
case 'P':
formatted+=new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:true }).format(this).toLowerCase();
++i;
break;
case 'r':
formatted+=this.format("%I:%M:%S %p");
++i;
break;
case 'R':
formatted+=this.format("%H:%M");
++i;
break;
case 's':
formatted+=Math.floor(this.getTime()/1000);
++i;
break;
case 'S':
formatted+=String(this.getSeconds()).padStart(2,'0');
++i;
break;
case 't':
formatted+="\t";
++i;
break;
case 'T':
formatted+=this.format("%H:%M:%S");
++i;
break;
case 'u':
formatted+=this.getDay()||7;
++i;
break;
case 'U':
formatted+=String(
Math.ceil((this-new Date(this.getFullYear(),0,1))/(86400*1000)+1)/7
).padStart(2,'0');
++i;
break;
case 'V':
const jan4=new Date(this.getFullYear(),0,4);
const startOfWeek=new Date(this.getFullYear(),0,1);
const daysSinceJan4=Math.floor((this-jan4)/(86400*1000));
const weekNumber=Math.ceil((daysSinceJan4+jan4.getDay()+1)/7);
formatted+=String(weekNumber).padStart(2,'0');
++i;
break;
case 'w':
formatted+=this.getDay();
++i;
break;
case 'W':
formatted+=String(
Math.floor((this-new Date(this.getFullYear(),0,1))/(86400*1000)+1)/7
).padStart(2,'0');
++i;
break;
case 'x':
formatted+=new Intl.DateTimeFormat('en-US').format(this);
++i;
break;
case 'X':
formatted+=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'numeric',second:'numeric'}).format(this);
++i;
break;
case 'y':
formatted+=String(this.getFullYear()).slice(-2);
++i;
break;
case 'Y':
formatted+=String(this.getFullYear());
++i;
break;
case ':':
case 'z':
const timezoneOffset=this.getTimezoneOffset();
const sign=timezoneOffset>0?'-':'+';
const hours=String(Math.floor(Math.abs(timezoneOffset)/60)).padStart(2,'0');
const minutes=String(Math.abs(timezoneOffset)%60).padStart(2,'0');
if (format[i+1]==="z"){
formatted+=`${sign}${hours}${minutes}`;
i+=1;
}
else if (format[i+2]==="z"){
formatted+=`${sign}${hours}:${minutes}`;
i+=2;
}
else if (format[i+3]==="z"){
formatted+=`${sign}${hours}:${minutes}:${this.format('XN')}`;
i+=3;
}
else if (format[i+4]==="z"){
formatted+=`${sign}${hours}:${minutes}:${this.format('XN').slice(0,2)}`;
i+=4;
}
break;
case 'Z':
formatted+=Intl.DateTimeFormat('en-US',{timeZoneName:'short'}).format(this);
++i;
break;
default:
formatted+=format[i];
break;
}
}else {
formatted+=format[i];
}
}
return formatted;
}
msec(){return this.getTime();}
sec(){return parseInt(this.getTime()/1000);}
hour_start(){
const date=new D(this.getTime())
date.setMinutes(0,0,0);
return date;
}
day_start(){
const date=new D(this.getTime())
date.setHours(0,0,0,0);
return date;
}
week_start(sunday_start=true){
const diff=(this.getDay()+7-(sunday_start?0:1))%7;
const date=new D(this.getTime())
date.setDate(this.getDate()-diff)
date.setHours(0,0,0,0);;
return date;
}
month_start(){
const date=new D(this.getTime())
date.setDate(1)
date.setHours(0,0,0,0,0);
return date;
}
quarter_year_start(){
const date=new D(this.getTime())
const month=date.getMonth()+1;
if (month>9){
date.setMonth(9-1,1)
date.setHours(0,0,0,0,0);
}else if (month>6){
date.setMonth(6-1,1)
date.setHours(0,0,0,0,0);
}else if (month>3){
date.setMonth(3-1,1)
date.setHours(0,0,0,0,0);
}else {
date.setMonth(0,1)
date.setHours(0,0,0,0,0);
}
return date;
}
half_year_start(){
const date=new D(this.getTime())
if (date.getMonth()+1>6){
date.setMonth(5,1)
date.setHours(0,0,0,0,0);
}else {
date.setMonth(0,1)
date.setHours(0,0,0,0,0);
}
return date;
}
year_start(){
const date=new D(this.getTime())
date.setMonth(0,1)
date.setHours(0,0,0,0,0);
return date;
}
}
vlib.colors=class Colors{
static black="\u001b[30m";
static red="\u001b[31m";
static green="\u001b[32m";
static yellow="\u001b[33m";
static blue="\u001b[34m";
static magenta="\u001b[35m";
static cyan="\u001b[36m";
static gray="\u001b[37m";
static bold="\u001b[1m";
static italic="\u001b[3m";
static end="\u001b[0m";
static enable(){
Colors.black="\u001b[30m";
Colors.red="\u001b[31m";
Colors.green="\u001b[32m";
Colors.yellow="\u001b[33m";
Colors.blue="\u001b[34m";
Colors.magenta="\u001b[35m";
Colors.cyan="\u001b[36m";
Colors.gray="\u001b[37m";
Colors.bold="\u001b[1m";
Colors.italic="\u001b[3m";
Colors.end="\u001b[0m";
}
static disable(){
Colors.black="";
Colors.red="";
Colors.green="";
Colors.yellow="";
Colors.blue="";
Colors.magenta="";
Colors.cyan="";
Colors.gray="";
Colors.bold="";
Colors.italic="";
Colors.end="";
}
}
vlib.print=function(...args){
console.log(args.join(""));
}
vlib.printe=function(...args){
console.error(args.join(""));
}
vlib.print_marker=function(...args){
vlib.print(vlib.colors.blue,">>> ",vlib.colors.end,...args);
}
vlib.print_warning=function(...args){
vlib.print(vlib.colors.yellow,">>> ",vlib.colors.end,...args);
}
vlib.print_error=function(...args){
vlib.printe(vlib.colors.red,">>> ",vlib.colors.end,...args);
}
vlib.Path=class Path{
constructor(path,clean=true){
if (path==null){
throw Error(`Invalid path "${path}".`);
}
else if (path instanceof vlib.Path){
this._path=path._path;
}else {
if (clean){
this._path="";
const max_i=path.length-1;
for (let i=0;i<path.length;i++){
const c=path.charAt(i);
if (c==="/"&&(this._path.charAt(this._path.length-1)==="/"||i==max_i)){
continue;
}
else if (c==="."&&path.charAt(i-1)==="/"&&path.charAt(i+1)==="/"){
continue;
}else {
this._path+=c;
}
}
}else {
this._path=path;
}
}
}
trim(){
const start=0,end=this._path.length;
for (let i=0;i<this._path.length;i++){
const c=this._path.charAt(i);
if (c==" "||c=="\t"){
++start;
}else {
break;
}
}
for (let i=end-1;i>=0;i--){
const c=this._path.charAt(i);
if (c==" "||c=="\t"){
--end;
}else {
break;
}
}
if (start!=0||end!=this._path.length){
this._path=this._path.susbtr(start,end-start);
}
if (this._path.length===0){
throw Error(`Invalid path "${this._path}".`);
}
}
toString(){
return this._path;
}
str(){
return this._path;
}
static home(){
return new Path(libos.homedir());
}
get length(){
return this._path.length;
}
get len(){
return this._path.length;
}
get stat(){
if (this._stat!==undefined){
return this._stat;
}
this._stat=vlib.utils.edit_obj_keys(
libfs.statSync(this._path),
[
["atimeMs","atime"],
["mtimeMs","mtime"],
["ctimeMs","ctime"],
["birthtimeMs","birthtime"],
],
[
"atime",
"mtime",
"ctime",
"birthtime",
]
);
return this._stat;
}
get dev(){
return this.stat.dev;
}
get ino(){
return this.stat.ino;
}
get mode(){
return this.stat.mode;
}
get nlink(){
return this.stat.nlink;
}
get uid(){
return this.stat.uid;
}
get gid(){
return this.stat.gid;
}
get rdev(){
return this.stat.rdev;
}
get size(){
return this.stat.size;
}
get blksize(){
return this.stat.blksize;
}
get blocks(){
return this.stat.blocks;
}
get atime(){
return this.stat.atime;
}
get mtime(){
return this.stat.mtime;
}
get ctime(){
return this.stat.ctime;
}
get birthtime(){
return this.stat.birthtime;
}
reset(){
this._stat=undefined;
this._name=undefined;
this._extension=undefined;
this._base=undefined;
this._abs=undefined;
return this;
}
is_dir(){
return this.stat.isDirectory();
}
exists(){
return libfs.existsSync(this._path);
}
name(with_extension=true){
if (with_extension===false){
const name=this.name();
const ext=this.extension();
return name.substr(0,name.length-ext.length);
}
if (this._name!==undefined){return this._name;}
this._name="";
for (let i=this._path.length-1;i>=0;i--){
const c=this._path.charAt(i);
if (c==="/"){
break;
}
this._name+=c;
}
this._name=this._name.reverse();
return this._name;
}
extension(){
if (this._extension!==undefined){return this._extension;}
if (this._name===undefined){this.name();}
this._extension="";
for (let i=this._name.length-1;i>=0;i--){
const c=this._name.charAt(i);
this._extension+=c;
if (c==="."){
this._extension=this._extension.reverse();
return this._extension;
}
}
this._extension="";
}
base(back=1){
if (back===1&&this._base!==undefined){return this._base;}
let count=0,end=0;
for (end=this._path.length-1;end>=0;end--){
const c=this._path.charAt(end);
if (c==="/"){
++count;
if (back===count){
break;
}
}
}
if (end===0){
return null;
}
if (back===1){
this._base=new Path(this._path.substr(0,end));
return this._base;
}else {
return new Path(this._path.substr(0,end));
}
}
abs(){
if (this._abs!==undefined){return this._abs;}
this._abs=new Path(libpath.resolve(this._path));
return this._abs;
}
join(subpath,clean=true){
return new Path(`${this._path}/${subpath}`,clean);
}
async cp(destination){
return new Promise(async (resolve,reject)=>{
if (destination==null){
return reject("Define parameter \"destination\".");
}
if (destination instanceof Path){
destination=destination._path;
}
try {
libfsextra.copy(this._path,destination,(err)=>reject(err));
}catch (err){
return reject(err);
}
resolve();
})
}
cp_sync(destination){
return new Promise(async (resolve,reject)=>{
if (destination==null){
return reject("Define parameter \"destination\".");
}
if (destination instanceof Path){
destination=destination._path;
}
try {
libfsextra.copySync(this._path,destination);
}catch (err){
return reject(err);
}
resolve();
})
}
async mv(destination){
return new Promise((resolve,reject)=>{
if (libfs.existsSync(destination)){
return reject("Destination path already exists.");
}
libfsextra.move(this._path,destination,(err)=>{
if (err){
reject(err);
}else {
this._stat=undefined;
resolve();
}
});
})
}
async del(){
return new Promise((resolve,reject)=>{
if (this.exists()){
if (this.is_dir()){
libfs.rmdir(this._path,(err)=>{
if (err){
reject(err);
}else {
this._stat=undefined;
resolve();
}
});
}else {
libfs.unlink(this._path,(err)=>{
if (err){
reject(err);
}else {
this._stat=undefined;
resolve();
}
});
}
}
})
}
del_sync(){
if (this.exists()){
if (this.is_dir()){
libfs.rmdirSync(this._path);
}else {
libfs.unlinkSync(this._path);
}
}
return this;
}
async trash(){
return new Promise(async (resolve,reject)=>{
const name=this.name();
let trash;
switch (libos.platform()){
case 'darwin':
trash=libpath.join(libos.homedir(),'.Trash');
break;
case 'linux':
const xdgDataHome=process.env.XDG_DATA_HOME||libpath.join(libos.homedir(),'.local','share');
trash=libpath.join(xdgDataHome,'Trash');
break;
default:
return reject("Unsupported platform.");
}
if (trash==null){
return reject("Unsupported platform.");
}
let destination;
try {
destination=`${trash}/${name}`;
let counts=0;
while (libfs.existsSync(destination)){
++counts;
destination=`${trash}/${name}-${counts}`
}
await this.mv(destination);
}catch (err){
return reject(err);
}
resolve();
})
}
async mkdir(){
return new Promise((resolve,reject)=>{
if (this.exists()){
return resolve();
}
libfs.mkdir(this._path,{recursive:true },(err)=>{
if (err){
reject(err);
}else {
this._stat=undefined;
resolve();
}
});
});
}
mkdir_sync(){
if (this.exists()){
return ;
}
libfs.mkdirSync(this._path,{recursive:true })
return this;
}
async touch(){
return this.save("");
}
async load({type="string",encoding=null}={}){
return new Promise((resolve,reject)=>{
libfs.readFile(this._path,encoding,(err,data)=>{
if (err){
reject(err);
}else {
if (type==null){
resolve(data);
}else if (type==="string"){
resolve(data.toString());
}else if (type==="array"||type==="object"){
resolve(JSON.parse(data));
}else if (type==="number"){
resolve(parseFloat(data.toString()));
}else if (type==="boolean"){
data=data.toString();
resolve(data="1"||data==="true"||data==="TRUE"||data==="True");
}else {
reject(`Invalid value for parameter "type", the valid values are [undefined, boolean, number, string, array, object].`);
}
}
});
});
}
load_sync({type="string",encoding=null}={}){
const data=libfs.readFileSync(this._path,encoding);
if (type==null){
return data;
}else if (type==="string"){
return data.toString();
}else if (type==="array"||type==="object"){
return JSON.parse(data);
}else if (type==="number"){
return parseFloat(data.toString());
}else if (type==="boolean"){
data=data.toString();
return data="1"||data==="true"||data==="TRUE"||data==="True";
}else {
throw Error(`Invalid value for parameter "type", the valid values are [undefined, boolean, number, string, array, object].`);
}
}
async save(data){
return new Promise((resolve,reject)=>{
libfs.writeFile(this._path,data,(err)=>{
if (err){
reject(err);
}else {
this._stat=undefined;
resolve();
}
});
});
}
save_sync(data){
libfs.writeFileSync(this._path,data);
return this;
}
async paths(recursive=false){
return new Promise(async (resolve,reject)=>{
if (!this.is_dir()){
return reject(`Path "${this._path}" is not a directory.`);
}
if (recursive===false){
libfs.readdir(this._path,(err,files)=>{
if (err){
reject(err);
}else {
resolve(files.map((name)=>(this.join(name))));
}
});
}else {
const files=[];
const traverse=(path)=>{
return new Promise((resolve,reject)=>{
libfs.readdir(path, async (err,files)=>{
if (err){
reject(err);
}else {
let err=null;
for (let i=0;i<files.length;i++){
const child=path.join(files[i]);
files.push(child);
if (child.is_dir()){
try {
await traverse(child);
}catch (e){
err=e;
return false;
}
}
}
if (err===null){
resolve();
}else {
reject(err);
}
}
});
})
}
try {
await traverse(this);
}catch (err){
return reject(err);
}
resolve(files);
}
});
}
paths_sync(recursive=false){
if (!this.is_dir()){
throw Error(`Path "${this._path}" is not a directory.`);
}
if (recursive===false){
return libfs.readdirSync(this._path).map((name)=>(this.join(name)));
}else {
const files=[];
const traverse=(path)=>{
libfs.readdirSync(path.toString()).iterate((name)=>{
const child=path.join(name);
files.push(child);
if (child.is_dir()){
traverse(child);
}
});
}
traverse(this);
return files;
}
}
}
vlib.Proc=class Proc{
constructor({debug=false}={}){
this.debug=debug;
this.proc=null;
this.promise=null;
this.err=null;
this.out=null;
this.exit_status=null;
}
on_output(data){
}
on_error(data){
return null;
}
on_exit(code){
return null;
}
start({
command="",
args=[],
working_directory=null,
interactive=true,
detached=false,
env=null,
colors=false,
opts={},
}){
this.out=null;
this.err=null;
this.exit_status=null;
this.promise=new Promise((resolve)=>{
if (this.debug){
console.log(`Start: ${command} ${args.join(" ")}`);
}
const options={
cwd:working_directory,
stdio:[interactive?"pipe":"ignore","pipe","pipe"],
shell:interactive,
detached:detached,
...opts,
}
if (env!=null){
options.env=env;
if (colors){
options.env.FORCE_COLOR=true;
}
}else if (colors){
options.env={...process.env,FORCE_COLOR:true };
}
this.proc=libproc.spawn(
command,
args,
options,
);
let closed=0;
if (this.proc.stdout){
this.proc.stdout.on('data',(data)=>{
data=data.toString();
if (this.debug){
console.log("OUT:",data);
}
if (this.out===null){
this.out="";
}
this.out+=data;
if (this.on_output!==undefined){
this.on_output(data)
}
})
}
if (this.proc.stderr){
this.proc.stderr.on('data',(data)=>{
data=data.toString();
if (this.debug){
console.log("ERR:",data);
}
if (this.err===null){
this.err="";
}
this.err+=data;
if (this.on_error!==undefined){
this.on_error(data);
}
});
}
this.proc.on('exit',(code)=>{
if (this.debug&&closed===1){
console.log(`Child process exited with code ${code}.`);
}
this.exit_status=code;
if (code!==0&&(this.err==null||this.err.length===0)){
this.err=`Child process exited with code ${code}.`;
}
if (this.on_exit!==undefined){
this.on_exit(code);
}
++closed;
if (closed==2){
resolve();
}
});
this.proc.on('close',(code)=>{
if (this.debug&&closed===1){
console.log(`Child process exited with code ${code}.`);
}
++closed;
if (closed==2){
resolve();
}
});
});
return this.promise;
}
write(data){
if (this.proc!==null){
this.proc.stdin.write(data);
}
return this;
}
async join(){
return new Promise(async (resolve)=>{
await this.promise;
resolve();
})
}
kill(signal="SIGINT"){
if (this.proc==null){return this;}
this.proc.kill(signal);
return this;
}
}
vlib.network=class network{
static private_ip(family="ipv4"){
const interfaces=libos.networkInterfaces();
for (const i in interfaces){
for (const ifc of interfaces[i]){
if (ifc.family.toLowerCase()===family&&!ifc.internal){
return ifc.address;
}
}
}
throw Error("Unable to retrieve the private ip.");
}
}
vlib.ProgressLoader=class ProgessLoader{
constructor({message="Loading",steps=100,step=0,width=10}){
this.message=message.trim();
this.steps=steps;
this.step=step;
this.width=width;
this.progess=0;
this.last_progress=null;
this.next(false);
}
next(increment=true){
if (increment){
++this.step;
}
this.progress=this.step/this.steps;
const fixed=(this.progress*100).toFixed(2);
if (fixed!=this.last_progress){
this.last_progress=fixed;
const completed=Math.floor(this.progress*this.width);
const remaining=this.width-completed;
process.stdout.write(`\r${this.message} ${fixed}% [${"=".repeat(completed)}${".".repeat(remaining)}]${this.progress>=1?'\n':''}`);
}
}
}
vlib.CLI=class CLI{
constructor({
name=null,
version=null,
commands=[],
start_index=2,
}){
this.name=name;
this.version=version;
this.commands=commands;
this.start_index=start_index;
}
_cast(value,type){
if (type==null){
return value;
}
else if (type==="string"){
if (typeof value!=="string"){
value=value.toString();
}
return value;
}
else if (type==="number"){
if (typeof value!=="number"){
const new_value=parseFloat(value);
if (isNaN(new_value)){
throw Error(`Unable to cast "${value}" to a "number".`);
}
return new_value;
}
return value;
}
else if (type==="array"){
if (!Array.isArray(value)){
value=value.split(",");
}
return value;
}
else {
throw Error(`Unsupported cast type "${type}".`);
}
}
get({id,index=null,type=null,def=null,exclude_args=true}){
if (index!=null){
const value=process.argv[this.start_index+index];
if (value===undefined){
return {found:false,value:def};
}
return {found:true,value:this._cast(value,type)};
}
const is_array=Array.isArray(id);
for (let i=this.start_index;i<process.argv.length;i++){
if ((is_array&&id.includes(process.argv[i]))||(is_array===false&&process.argv[i]===id)){
const value=process.argv[i+1];
if (value===undefined||(exclude_args&&value.charAt(0)==="-")){
return {found:true,value:def};
}
return {found:true,value:this._cast(value,type)};
}
}
return {found:false,value:def};
}
present(id){
const is_array=Array.isArray(id);
for (let i=this.start_index;i<process.argv.length;i++){
if ((is_array&&id.includes(process.argv[i]))||(is_array===false&&process.argv[i]===id)){
return true;
}
}
return false;
}
error(...err){
err=err.join("").toString();
if (err.eq_first("Error: ")||err.eq_first("error: ")){
err=err.substr(7).trim();
}
console.log(`${vlib.colors.red}Error${vlib.colors.end}: ${err}`)
}
throw_error(...err){
this.error(...err);
process.exit(1);
}
docs(command_or_commands=null){
if (command_or_commands==null){
command_or_commands=this.commands;
}
let docs="";
if (this.name!=null){
docs+=this.name;
}
if (this.version!=null){
docs+=` v${this.version}`;
}
if (docs.length>0){
docs+=".\n";
}
const add_keys_and_values=(list)=>{
let max_length=0;
list.iterate((item)=>{
if (item[0].length>max_length){
max_length=item[0].length;
}
})
list.iterate((item)=>{
while (item[0].length<max_length+4){
item[0]+=" ";
}
docs+=item[0]+item[1];
})
}
if (Array.isArray(command_or_commands)){
docs+=`Usage: $ ${this.name} [mode] [options]\n`;
let index=0;
let list=[];
command_or_commands.iterate((command)=>{
const list_item=[];
if (Array.isArray(command.id)){
list_item[0]=`    ${command.id.join(", ")}`;
}else {
list_item[0]=`    ${command.id}`;
}
if (command.description!=null){
list_item[1]=command.description;
}
list_item[1]+="\n";
list.push(list_item);
})
list.push([
"    --help, -h",
"Show the overall documentation or when used in combination with a command, show the documentation for a certain command.",
])
add_keys_and_values(list);
}
else {
docs+=`Usage: $ ${this.name} ${command_or_commands.id} [options]\n`;
if (command_or_commands.description){
docs+=`\n`;
docs+=command_or_commands.description;
docs+=`\n`;
}
if (command_or_commands.args.length>0){
docs+=`\nOptions:\n`;
let arg_index=0;
const list=[];
command_or_commands.args.iterate((arg)=>{
const list_item=[];
if (arg.id==null){
list_item[0]=`    argument ${arg_index}`;
}
else if (Array.isArray(arg.id)){
list_item[0]=`    ${arg.id.join(", ")}`;
}else {
list_item[0]=`    ${arg.id}`;
}
if (arg.type!=null&&arg.type!=="bool"&&arg.type!=="boolean"){
list_item[0]+=` <${arg.type}>`;
}
if (arg.required===true){
list_item[0]+=" (required)";
}
if (arg.description!=null){
list_item[1]=arg.description;
}
list_item[1]+="\n";
list.push(list_item);
++arg_index;
})
add_keys_and_values(list);
}
if (command_or_commands.examples!=null){
docs+=`\nExamples:\n`;
if (typeof command_or_commands.examples==="string"){
if (command_or_commands.examples.charAt(0)==="$"){
docs+=`    ${vlib.colors.italic}${command_or_commands.examples}${vlib.colors.end}\n`;
}else {
docs+=`    ${vlib.colors.italic}$ ${command_or_commands.examples}${vlib.colors.end}\n`;
}
}
else if (Array.isArray(command_or_commands.examples)){
command_or_commands.examples.iterate((item)=>{
if (item.charAt(0)==="$"){
docs+=`    ${vlib.colors.italic}${item}${vlib.colors.end}\n`;
}else {
docs+=`    ${vlib.colors.italic}$ ${item}${vlib.colors.end}\n`;
}
})
}
else if (typeof command_or_commands.examples==="command_or_commandsect"){
const descs=Object.keys(command_or_commands.examples);
const list=[];
descs.iterate((desc)=>{
const list_item=[`    ${desc}:`];
const example=command_or_commands.examples[desc];
if (example.charAt(0)==="$"){
list_item[1]=`${vlib.colors.italic}${example}${vlib.colors.end}\n`;
}else {
list_item[1]=`${vlib.colors.italic}$ ${example}${vlib.colors.end}\n`;
}
list.push(list_item);
})
add_keys_and_values(list);
}
}
if (docs.charAt(docs.length-1)==="\n"){
docs=docs.substr(0,docs.length-1);
}
}
console.log(docs);
}
async start(){
const help=this.present(["-h","--help"])
let matched=false;
for (let i=0;i<this.commands.length;i++){
const command=this.commands[i];
if (this.present(command.id)){
if (help){
this.docs(command);
return true;
}
const callback_args={_command:command};
let arg_index=0;
const err=command.args.iterate((arg)=>{
try {
let id_name;
if (arg.id==null){
id_name=`arg${arg_index}`;
}else {
id_name=arg.id;
if (Array.isArray(id_name)){
id_name=id_name[0];
}
while (id_name.length>0&&id_name[0]=="-"){
id_name=id_name.substr(1);
}
id_name=id_name.replaceAll("-","_");
if (id_name==""){
return `Invalid argument id "${arg.id}".`;
}
}
if (arg.type==="bool"||arg.type==="boolean"){
callback_args[id_name]=this.present(arg.id)
}
else {
let {found,value}=this.get({
id:arg.id,
index:arg.id==null?arg_index:null,
type:arg.type,
def:undefined,
});
if (found===false&&arg.required===true){
return `Define parameter "${arg.id}".`;
}
if (found===true&&value==null&&arg.default!==undefined){
value=arg.default;
}
if (value!=null){
callback_args[id_name]=value;
}
}
}
catch (err){
return err;
}
++arg_index;
})
if (err){
this.docs(command);
this.error(err);
return true;
}
try {
const res=command.callback(callback_args);
if (res instanceof Promise){
await res;
}
}catch (err){
this.docs(command);
this.error(err);
process.exit(1);
}
matched=true;
break;
}
}
if (!matched&&help){
this.docs();
return true;
}
if (!matched){
this.docs();
this.error("Invalid mode.");
return false;
}
return true;
}
}
const libhttps=require("https")
const zlib=require('zlib');
vlib.request=async function({
host,
port=null,
endpoint,
method="GET",
headers={},
params=null,
compress=false,
decompress=true,
query=true,
json=false,
reject_unauthorized=true,
delay=null,
}){
return new Promise((resolve)=>{
method=method.toUpperCase();
if (query&&method==="GET"&&params!=null){
if (typeof params==="object"){
params=Object.entries(params).map(([key,value])=>`${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
}else {
throw Error("Invalid value type for parameter \"params\", the valid type is \"object\".");
}
endpoint+=`?${params}`;
params=null;
}
if (params!=null&&typeof params==="object"){
params=JSON.stringify(params);
}
if (compress){
params=zlib.gzipSync(params);
headers["Content-Encoding"]="gzip";
}
if (params!=null){
headers["Content-Length"]=params.length;
}
options={
hostname:host,
port:port,
path:endpoint,
method:method,
headers:headers,
rejectUnauthorized:reject_unauthorized,
};
let error=null,body="",status=null,res_headers={};
const on_end=()=>{
if (body.length>0&&json){
try {body=JSON.parse(body);}
catch (e){}
}
if (delay==null){
resolve({
body,
error,
status,
headers:res_headers,
});
}else {
setTimeout(()=>resolve({
body,
error,
status,
headers:res_headers,
}),delay)
}
}
const req=libhttps.request(options,(res)=>{
status=res.statusCode;
res_headers=res.headers;
const content_encoding=res.headers['content-encoding'];
if (content_encoding==="gzip"||content_encoding==="deflate"){
let stream;
if (content_encoding==="gzip"){
stream=zlib.createGunzip();
}else if (content_encoding==="deflate"){
stream=zlib.createInflate();
}
res.pipe(stream)
stream.on("data",(chunk)=>{
body+=chunk.toString();
})
stream.on("end",on_end)
}
else {
res.on("data",(chunk)=>{
body+=chunk.toString();
})
res.on("end",on_end)
}
});
req.on("error",(e)=>{
error=e;
if (error.response){
status=error.response.statusCode;
}
on_end()
});
if (params!=null){
req.write(params);
}
req.end();
});
}
vlib.version=require("./.version.js")
module.exports=vlib;
