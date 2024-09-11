/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 - 2024 Daan van den Bergh
 * Version: v1.3.1
 */
const libfs=require('fs');
const libfsextra=require('fs-extra');
const libos=require('os');
const libpath=require('path');
const libproc=require("child_process");
const libhttp=require('http');
const libhttps=require('https');
const libhttp2=require('http2');
const libbson=require('bson');
const zlib=require('zlib');
const sysinfo=require('systeminformation');
const readlinelib=require('readline');
const diskusagelib=require('diskusage');
const libcluster=require('cluster');
const libcrypto=require("crypto");
const vlib={};
vlib.internal={};
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
String.prototype.eq_first=String.prototype.startsWith;
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
if (this[i]!==item){
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
Array.prototype.divide=function(into=2){
let divided=[];
for (let i=0;i<this.length;i++){
const chunk=Math.floor(i/into);
if (divided[chunk]===undefined){
divided[chunk]=[];
}
divided[chunk].push(this[i]);
}
return divided;
};
vlib.object={};
vlib.object.expand=function(x,y){
const keys=Object.keys(y);
for (let i=0;i<keys.length;i++){
x[keys[i]]=y[keys[i]];
}
return x;
}
Object.expand=vlib.object.expand;
vlib.internal.obj_eq=function(x,y,detect_keys=false,detect_keys_nested=false){
if (typeof x!==typeof y){return false;}
else if (x instanceof String){
return x.toString()===y.toString();
}
else if (Array.isArray(x)){
if (!Array.isArray(y)||x.length!==y.length){return false;}
for (let i=0;i<x.length;i++){
if (!vlib.internal.obj_eq(x[i],y[i])){
return false;
}
}
return true;
}
else if (x!=null&&typeof x==="object"){
const changes=[];
const x_keys=Object.keys(x);
const y_keys=Object.keys(y);
if (x_keys.length!==y_keys.length){
return false;
}
for (const key of x_keys){
if (!y.hasOwnProperty(key)){
const result=vlib.internal.obj_eq(x[key],y[key],detect_keys,detect_keys_nested)
if (detect_keys){
if (result===true){
changes.append(key)
}
else if (result!==false&&result.length>0){
changes.append(key)
if (detect_keys_nested){
changes.append(...result)
}
}
}else if (!result){
return false
}
}
}
if (detect_keys){
return changes.length===0?null :changes;
}
return true;
}
else {
return x===y;
}
}
Object.obj_eq=vlib.internal.obj_eq;
vlib.object.eq=function(x,y){
return vlib.internal.obj_eq(x,y);
}
Object.eq=vlib.object.eq;
vlib.object.detect_changes=function(x,y,include_nested=false){
return vlib.internal.obj_eq(x,y, true,include_nested);
}
Object.detect_changes=vlib.object.detect_changes;
vlib.object.rename_keys=(obj={},rename=[["old","new"]],remove=[])=>{
remove.iterate((key)=>{
delete obj[key];
})
rename.iterate((key)=>{
obj[key[1]]=obj[key[0]];
delete obj[key[0]];
})
return obj;
}
Object.rename_keys=vlib.object.rename_keys;
vlib.object.deep_copy=(obj)=>{
return vlib.utils.deep_copy(obj);
}
Object.deep_copy=vlib.object.deep_copy;
vlib.object.delete_recursively=(obj,remove_keys=[])=>{
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
Object.delete_recursively=vlib.object.delete_recursively;
vlib.object.detect_circular=(obj,attr='',seen=new Map())=>{
for (const key in obj){
if (Object.prototype.hasOwnProperty.call(obj,key)){
const new_attr=attr?`${attr}.${key}`:key;
const value=obj[key];
if (typeof value==='object'&&value!==null){
if (seen.has(value)){
let preview_value="";
console.log(`Circular reference detected at "${new_attr}", previously detected at "${seen.get(value)}"${preview_value}.`);
continue;
}
seen.set(value,new_attr);
Object.detect_circular(value,new_attr,seen);
}
}
}
}
Object.detect_circular=vlib.object.detect_circular;
vlib.object.remove=(obj,key_or_keys='',copy=false)=>{
if (copy){
obj={...obj};
}
if (Array.isArray(key_or_keys)){
for (const key of key_or_keys){
delete obj[key];
}
}else {
delete obj[key_or_keys];
}
return obj;
}
Object.remove=vlib.object.remove;
vlib.utils={};
vlib.utils.sleep=async function(msec){
return new Promise((resolve)=>setTimeout(resolve,msec))
}
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
vlib.utils.debounce=(delay,func)=>{
let timeout;
return function(...args){
clearTimeout(timeout);
timeout=setTimeout(()=>func.apply(this,args),delay);
};
}
vlib.utils.verify_params=function({
params={},
info={},
check_unknown=false,
parent="",
error_prefix="",
throw_err=true
}){
const params_keys=Object.keys(params);
const scheme_keys=Object.keys(info);
const throw_err_h=(e,field)=>{
const invalid_fields={};
invalid_fields[field]=e;
if (throw_err===false){
return {error:e,invalid_fields,params:null};
}
const error=new Error(e);
error.json={error:e,invalid_fields,params:null};
throw error;
}
const type_error_str=(scheme_item,prefix=" of type ")=>{
let type_error_str="";
if (Array.isArray(scheme_item.type)){
type_error_str=prefix;
for (let i=0;i<scheme_item.type.length;i++){
type_error_str+=`"${scheme_item.type[i]}"`
if (i===scheme_item.type.length-2){
type_error_str+=" or "
}else if (i<scheme_item.type.length-2){
type_error_str+=", "
}
}
type_error_str;
}else {
type_error_str=`${prefix}"${scheme_item.type}"`
}
return type_error_str;
}
const check_type=(scheme_item,scheme_key,type)=>{
switch (type){
case "null":
return params[scheme_key]==null;
case "array":
if (Array.isArray(params[scheme_key])===false){
return false;
}
return true;
case "object":
if (typeof params[scheme_key]!=="object"||params[scheme_key]==null){
return false;
}
if (scheme_item.attributes!==undefined){
let child_parent=`${parent}${scheme_key}.`;
try {
params[scheme_key]=vlib.utils.verify_params({
params:params[scheme_key],
info:scheme_item.attributes,
check_unknown,
parent:child_parent,
error_prefix,
throw_err:true,
});
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
if (type!==typeof params[scheme_key]){
return false;
}
return true;
}
}
if (Array.isArray(params)){
const scheme_item=scheme;
for (let index=0;index<params.length;i++){
if (scheme_item.type&&scheme_item.type!=="any"){
if (!(scheme_item.default==null&&params[index]==null)){
if (Array.isArray(scheme_item.type)){
let correct_type=false;
for (let i=0;i<scheme_item.type.length;i++){
const res=check_type(scheme_item,index,scheme_item.type[i]);
if (typeof res==="object"){
return res;
}
else if (res===true){
correct_type=true;
break;
}
}
if (correct_type===false){
const field=`${parent}${index}`;
const current_type=vlib.utils.value_type(params[index]);
return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item,"")}.`,field);
}
}
else {
const res=check_type(scheme_item,index,scheme_item.type);
if (typeof res==="object"){
return res;
}
else if (res===false){
const field=`${parent}${index}`;
const current_type=vlib.utils.value_type(params[index]);
return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item,"")}.`,field);
}
}
}
}
if (scheme_item.callback){
const err=scheme_item.callback(params[index],params);
if (err){
return throw_err_h(`${error_prefix}${err}`,`${parent}${index}`);
}
}
}
}
else {
for (let scheme_index=0;scheme_index<scheme_keys.length;scheme_index++){
const scheme_key=scheme_keys[scheme_index];
let scheme_item;
if (typeof info[scheme_key]==="string"){
info[scheme_key]={type:info[scheme_key]};
scheme_item=info[scheme_key];
}else {
scheme_item=info[scheme_key];
}
if (scheme_item.def){
scheme_item.default=scheme_item.def;
delete scheme_item.def;
}
if (scheme_item.attrs){
scheme_item.attributes=scheme_item.attrs;
delete scheme_item.attrs;
}
if (scheme_key in params===false){
if (scheme_item.default!==undefined){
params[scheme_key]=scheme_item.default;
}
else {
if (scheme_item.required===false){
continue;
}
else if (typeof item.required==="function"){
const required=item.required(params);
if (required){
const field=`${parent}${scheme_key}`;
return throw_err_h(`${error_prefix}Parameter "${field}" should be a defined value${type_error_str(scheme_item)}.`,field);
}
}else {
const field=`${parent}${scheme_key}`;
return throw_err_h(`${error_prefix}Parameter "${field}" should be a defined value${type_error_str(scheme_item)}.`,field);
}
}
continue;
}
else if (scheme_item.type&&scheme_item.type!=="any"){
if (!(scheme_item.default==null&&params[scheme_key]==null)){
if (Array.isArray(scheme_item.type)){
let correct_type=false;
for (let i=0;i<scheme_item.type.length;i++){
const res=check_type(scheme_item,scheme_key,scheme_item.type[i]);
if (typeof res==="object"){
return res;
}
else if (res===true){
correct_type=true;
break;
}
}
if (correct_type===false){
const field=`${parent}${scheme_key}`;
const current_type=vlib.utils.value_type(params[scheme_key]);
return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item,"")}.`,field);
}
}
else {
const res=check_type(scheme_item,scheme_key,scheme_item.type);
if (typeof res==="object"){
return res;
}
else if (res===false){
const field=`${parent}${scheme_key}`;
const current_type=vlib.utils.value_type(params[scheme_key]);
return throw_err_h(`${error_prefix}Parameter "${field}" has an invalid type "${current_type}", the valid type is ${type_error_str(scheme_item,"")}.`,field);
}
}
}
}
if (scheme_item.callback){
const err=scheme_item.callback(params[scheme_key],params);
if (err){
return throw_err_h(`${error_prefix}${err}`,`${parent}${scheme_key}`);
}
}
}
if (check_unknown){
for (let x=0;x<params_keys.length;x++){
if (params_keys[x] in info===false){
const field=`${parent}${params_keys[x]}`;
return throw_err_h(`${error_prefix}Parameter "${field}" is not a valid parameter.`,field);
}
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
try {
copy[keys[i]]=vlib.utils.deep_copy(values[i]);
}catch (err){
if (err.message.startsWith("Unable to copy attribute")){
throw err;
}
err.message=`Unable to copy attribute "${keys[i]}": ${err.message}.`;
throw err;
}
}
return copy;
}
else {
return obj;
}
}
vlib.prompt=async function(question){
return new Promise((resolve,reject)=>{
const interface=readlinelib.createInterface({
input:process.stdin,
output:process.stdout
});
interface.on('SIGINT',()=>{
interface.close();
reject(new Error("Interrupted by user [SIGINT]."));
});
try {
interface.question(question,(name)=>{
interface.close();
resolve(name);
});
}catch (e){
reject(e);
}
})
}
vlib.utils.value_type=function (value){
if (value==null){return "null";}
else if (typeof value==="object"&&Array.isArray(value)){return "array";}
else {return typeof value;}
}
vlib.utils.format_bytes=function (value){
if (value>1024*1024*1024*1024){
return `${(value/(1024*1024*1024*1024)).toFixed(2)}TB`;
}
else if (value>1024*1024*1024){
return `${(value/(1024*1024*1024)).toFixed(2)}GB`;
}
else if (value>1024*1024){
return `${(value/(1024*1024)).toFixed(2)}MB`;
}
else if (value>1024){
return `${(value/1024).toFixed(2)}KB`;
}
return `${parseInt(value)}B`;
}
vlib.utils.hash=(data,algo="sha256",format="hex")=>{
const hash=libcrypto.createHash(algo);
hash.update(data)
if (format){
return hash.digest(format);
}
return hash;
}
vlib.utils.fuzzy_search=({
query,
targets=[],
limit=25,
case_match=false,
allow_exceeding_chars=true,
get_matches=false,
key=null,
nested_key=null,
})=>{
if (query==null){
throw Error("Define parameter \"query\".");
}
const is_obj=targets.length>0&&typeof targets[0]==="object";
const is_array=targets.length>0&&Array.isArray(targets[0]);
if (is_obj&&key==null){key="query";}
const is_key_array=Array.isArray(key);
const results=[];
if (case_match===false){query=query.toLowerCase();}
const calc_sims=(targets=[])=>{
for (let i=0;i<targets.length;i++){
let match;
if (is_array){
match=vlib.utils.fuzzy_match(
query,
case_match?targets[i]:targets[i].toLowerCase(),
allow_exceeding_chars
);
}else if (is_obj){
const target=targets[i];
if (is_key_array){
let min_match=null;
for (let k=0;k<key.length;k++){
if (target[key[k]]==null){continue;}
match=vlib.utils.fuzzy_match(
query,
case_match?target[key[k]]:target[key[k]].toLowerCase(),
allow_exceeding_chars
);
if (match!=null&&(min_match===null||match<min_match)){
min_match=match;
}
}
match=min_match;
}else {
if (target[key]==null){continue;}
match=vlib.utils.fuzzy_match(
query,
case_match?target[key]:target[key].toLowerCase(),
allow_exceeding_chars
);
}
if (nested_key!==null&&target[nested_key]!=null){
calc_sims(target[nested_key]);
}
}else {
if (targets[i]==null){continue;}
match=vlib.utils.fuzzy_match(
query,
case_match?targets[i]:targets[i].toLowerCase(),
allow_exceeding_chars
);
}
if (match!==null){
results.push([match,targets[i]]);
}
}
}
calc_sims(targets);
results.sort((a,b)=>b[0]-a[0]);
if (limit!==null&&limit>=0&&results.length>limit){
results.length=limit;
}
if (get_matches===false){
let converted=[];
results.iterate((item)=>{
converted.push(item[1]);
})
return converted;
}
return results;
}
vlib.utils.fuzzy_match=(search,target,allow_exceeding_chars=true)=>{
if (allow_exceeding_chars===false){
if (search.length>target.length){
return null;
}
let text_count={};
for (let i=0;i<target.length;i++){
const c=target.charAt(i);
if (text_count[c]==null){
text_count[c]=1;
}else {
++text_count[c];
}
}
let query_count={};
for (let i=0;i<search.length;i++){
const c=search.charAt(i);
if (query_count[c]==null){
query_count[c]=1;
}else {
++query_count[c];
}
if (text_count[c]==null||query_count[c]>text_count[c]){
return null;
}
}
}
const get_search_code=(index)=>{
if (index>=0&&index<search.length){
return search.charCodeAt(index);
}
return-1;
};
const get_target_code=(index)=>{
if (index>=0&&index<target.length){
return target.charCodeAt(index);
}
return-1;
};
var prepareBeginningIndexes=(target)=>{
var targetLen=target.length
var beginningIndexes=[]; var beginningIndexesLen=0
var wasUpper=false
var wasAlphanum=false
for(var i=0;i<targetLen;++i){
var targetCode=target.charCodeAt(i)
var isUpper=targetCode>=65&&targetCode<=90
var isAlphanum=isUpper||targetCode>=97&&targetCode<=122||targetCode>=48&&targetCode<=57
var isBeginning=isUpper&&!wasUpper||!wasAlphanum||!isAlphanum
wasUpper=isUpper
wasAlphanum=isAlphanum
if(isBeginning)beginningIndexes[beginningIndexesLen++]=i
}
return beginningIndexes
}
var prepareNextBeginningIndexes=(target)=>{
var targetLen=target.length
var beginningIndexes=prepareBeginningIndexes(target)
var nextBeginningIndexes=[];
var lastIsBeginning=beginningIndexes[0]
var lastIsBeginningI=0
for(var i=0;i<targetLen;++i){
if(lastIsBeginning>i){
nextBeginningIndexes[i]=lastIsBeginning
}else {
lastIsBeginning=beginningIndexes[++lastIsBeginningI]
nextBeginningIndexes[i]=lastIsBeginning===undefined?targetLen:lastIsBeginning
}
}
return nextBeginningIndexes
}
let searchI=0;
let searchLen=search.length;
let searchCode=get_search_code(searchI);
let searchLower=search.toLowerCase();
let targetI=0;
let targetLen=target.length;
let targetCode=get_target_code(targetI);
let targetLower=target.toLowerCase();
let matchesSimple=[];
let matchesSimpleLen=0;
let successStrict=false
let matchesStrict=[];
let matchesStrictLen=0
for(;;){
var isMatch=searchCode===get_target_code(targetI)
if(isMatch){
matchesSimple[matchesSimpleLen++]=targetI
++searchI;
if(searchI===searchLen) break
searchCode=get_search_code(searchI)
}
++targetI;
if(targetI>=targetLen){
return null
}
}
searchI=0
targetI=0
nextBeginningIndexes=prepareNextBeginningIndexes(target);
var firstPossibleI=targetI=matchesSimple[0]===0?0:nextBeginningIndexes[matchesSimple[0]-1];
var backtrackCount=0
if(targetI!==targetLen){
for(;;){
if(targetI>=targetLen){
if(searchI<=0) break 
 ++backtrackCount; if(backtrackCount>200) break 
 --searchI
var lastMatch=matchesStrict[--matchesStrictLen]
targetI=nextBeginningIndexes[lastMatch]
}else {
var isMatch=get_search_code(searchI)===get_target_code(targetI)
if(isMatch){
matchesStrict[matchesStrictLen++]=targetI
++searchI; if(searchI===searchLen){successStrict=true; break }
++targetI
}else {
targetI=nextBeginningIndexes[targetI]
}
}
}
}
var substringIndex=targetLower.indexOf(searchLower,matchesSimple[0]);
var isSubstring=~substringIndex;
if(isSubstring&&!successStrict){
for(var i=0;i<matchesSimpleLen;++i){
matchesSimple[i]=substringIndex+i
}
}
var isSubstringBeginning=false;
if(isSubstring){
isSubstringBeginning=nextBeginningIndexes[substringIndex-1]===substringIndex
}
{
if(successStrict){var matchesBest=matchesStrict; var matchesBestLen=matchesStrictLen}
else {var matchesBest=matchesSimple; var matchesBestLen=matchesSimpleLen}
var score=0
var extraMatchGroupCount=0
for(var i=1;i<searchLen;++i){
if(matchesBest[i]-matchesBest[i-1]!==1){
score-=matchesBest[i];
++extraMatchGroupCount
}
}
var unmatchedDistance=matchesBest[searchLen-1]-matchesBest[0]-(searchLen-1)
score-=(12+unmatchedDistance)*extraMatchGroupCount
if(matchesBest[0]!==0)score-=matchesBest[0]*matchesBest[0]*.2
if(!successStrict){
score*=1000
}else {
var uniqueBeginningIndexes=1
for(var i=nextBeginningIndexes[0];i<targetLen;i=nextBeginningIndexes[i]){
++uniqueBeginningIndexes
}
if(uniqueBeginningIndexes>24)score*=(uniqueBeginningIndexes-24)*10
}
if(isSubstring)score/=1+searchLen*searchLen*1;
if(isSubstringBeginning)score/=1+searchLen*searchLen*1;
score-=targetLen-searchLen;
return score
}
}
vlib.json={};
vlib.json.parse=function(data){
function parse_js_object(_start_index=0,_return_end_index=false){
const object={};
let object_depth=0;
let is_before_initial_object=true;
let c;
let key=[];
let value=[];
let value_end_char=null;
let is_key=true;
let is_string=false;
let is_primitive=false;
const append_pair=()=>{
if (key.length>0){
let c;
while ((c=key.last())===" "||c==="\t"||c==="\n"){
--key.length;
}
if ((c=key[0])==="'"||c==="\""||c==="`"){
--key.length;
key=key.slice(1);
}
key=key.join("");
if (key.length>0){
if (is_string){
--value.length;
value=value.slice(1).join("");
}
else if (is_primitive){
value=value.join("")
switch (value){
case "true":value=true; break;
case "false":value=false; break;
case "null":value=null; break;
default:
let primitive;
if (value.includes('.')){
primitive=parseFloat(value);
}else {
primitive=parseInt(value);
}
if (!isNaN(primitive)){
value=primitive;
}
break;
}
}
object[key]=value;
}
}
key=[];
value=[];
value_end_char=null;
is_key=true;
is_string=false;
is_primitive=false;
}
for (let i=_start_index;i<data.length;i++){
c=data.charAt(i);
if (!is_string){
switch (c){
case "{":
++object_depth;
if (is_before_initial_object){
is_before_initial_object=false;
continue;
}
break;
case "}":
--object_depth;
if (object_depth===0){
append_pair();
if (_return_end_index){
return {index:i,object};
}
return object;
}
break;
default:
break;
}
}
if (is_before_initial_object){
continue;
}
else if (is_key){
switch (c){
case "'":
case "\"":
case "`":
if (is_string){
if (value_end_char===c){
is_string=false;
value_end_char=null;
}
}else {
value_end_char=c;
is_string=true;
}
key.append(c)
break;
case ":":
is_key=false;
value_end_char=null;
is_string=false;
continue;
case ",":
key=[];
continue;
case " ":
case "\t":
case "\n":
if (!is_string){
continue;
}
default:
key.append(c)
break;
}
}
else {
if (value_end_char===null&&(c!==" "&&c!=="\t"&&c!=="\n")){
switch (c){
case "'":
case "\"":
case "`":
value_end_char=c;
is_string=true;
break;
case "{":{
const response=parse_js_object(i, true);
i=response.index;
value=response.object;
append_pair();
--object_depth;
continue;
}
case "[":{
const response=parse_js_array(i, true);
i=response.index;
value=response.object;
append_pair();
continue;
}
default:
value_end_char=false;
is_primitive=true;
break;
}
}
else if (is_string&&value_end_char===c&&data.charAt(i-1)!=="\\"){
value.append(c);
append_pair();
continue;
}
else if (is_primitive&&(c===","||c===" "||c==="\t"||c==="\n")){
append_pair();
continue;
}
if (value.length===0&&(c===" "||c==="\t"||c==="\n")){
continue;
}
value.append(c);
}
}
append_pair();
if (_return_end_index){
return {index:data.length-1,object};
}
return object;
}
function parse_js_array(_start_index=0,_return_end_index=false){
const object=[];
let object_depth=0;
let is_before_initial_object=true;
let c;
let value=[];
let value_end_char=null;
let is_string=false;
let is_primitive=false;
let is_object=false;
const append_value=()=>{
if (is_object||value.length>0){
if (is_string){
--value.length;
value=value.slice(1).join("");
}
else if (is_primitive){
value=value.join("")
switch (value){
case "true":value=true; break;
case "false":value=false; break;
case "null":value=null; break;
default:
let primitive;
if (value.includes('.')){
primitive=parseFloat(value);
}else {
primitive=parseInt(value);
}
if (!isNaN(primitive)){
value=primitive;
}
break;
}
}
object.append(value);
}
value=[];
value_end_char=null;
is_string=false;
is_primitive=false;
is_object=false;
}
for (let i=_start_index;i<data.length;i++){
c=data.charAt(i);
if (!is_string){
switch (c){
case "[":
++object_depth;
if (is_before_initial_object){
is_before_initial_object=false;
continue;
}
break;
case "]":
--object_depth;
if (object_depth===0){
append_value();
if (_return_end_index){
return {index:i,object};
}
return object;
}
break;
default:
break;
}
}
if (is_before_initial_object){
continue;
}
else if (value_end_char===null&&(c!==" "&&c!=="\t"&&c!=="\n")){
switch (c){
case ",":
value=[];
continue;
case "'":
case "\"":
case "`":
value_end_char=c;
is_string=true;
break;
case "{":{
const response=parse_js_object(i, true);
i=response.index;
value=response.object;
is_object=true;
append_value();
continue;
}
case "[":{
const response=parse_js_array(i, true);
i=response.index;
value=response.object;
is_object=true;
append_value();
--object_depth;
continue;
}
default:
value_end_char=false;
is_primitive=true;
break;
}
}
else if (is_string&&value_end_char===c&&data.charAt(i-1)!=="\\"){
value.append(c);
append_value();
continue;
}
else if (is_primitive&&(c===","||c===" "||c==="\t"||c==="\n")){
append_value();
continue;
}
if (value.length===0&&(c===" "||c==="\t"||c==="\n")){
continue;
}
value.append(c);
}
append_value();
if (_return_end_index){
return {index:data.length-1,object};
}
return object;
}
for (let i=0;i<data.length;i++){
const c=data.charAt(i);
switch (c){
case "{":
return parse_js_object(i);
case "[":
return parse_js_array(i);
default:
break;
}
}
throw new Error("Unable to detect an object or array in the string data.");
}
vlib.scheme={};
vlib.scheme.value_type=function (value){
if (value==null){return "null";}
else if (typeof value==="object"&&Array.isArray(value)){return "array";}
else {return typeof value;}
}
vlib.scheme.init_scheme_item=(scheme_item,scheme=undefined,scheme_key=undefined)=>{
if (typeof scheme_item==="string"){
scheme_item={type:scheme_item};
if (scheme!==undefined&&scheme_key!==undefined){
scheme[scheme_key]=scheme_item;
}
}
else {
if (scheme_item.def!==undefined){
scheme_item.default=scheme_item.def;
delete scheme_item.def;
}
if (scheme_item.attrs!==undefined){
scheme_item.scheme=scheme_item.attrs;
delete scheme_item.attrs;
}
else if (scheme_item.attributes!==undefined){
scheme_item.scheme=scheme_item.attributes;
delete scheme_item.attributes;
}
if (scheme_item.enumerate!==undefined){
scheme_item.enum=scheme_item.enumerate;
delete scheme_item.enumerate;
}
}
return scheme_item;
}
vlib.scheme.type_error_str=(scheme_item,prefix=" of type ")=>{
let type_error_str="";
if (Array.isArray(scheme_item.type)){
type_error_str=prefix;
for (let i=0;i<scheme_item.type.length;i++){
if (typeof scheme_item.type[i]==="function"){
try {
type_error_str+=`"${scheme_item.type[i].name}"`
}catch (e){
type_error_str+=`"${scheme_item.type[i]}"`
}
}else {
type_error_str+=`"${scheme_item.type[i]}"`
}
if (i===scheme_item.type.length-2){
type_error_str+=" or "
}else if (i<scheme_item.type.length-2){
type_error_str+=", "
}
}
}else {
type_error_str=`${prefix}"${scheme_item.type}"`
}
return type_error_str;
}
vlib.scheme.verify=function({
object={},
scheme={},
value_scheme=null,
check_unknown=false,
parent="",
error_prefix="",
throw_err=true,
}){
const throw_err_h=(e,field)=>{
const invalid_fields={};
invalid_fields[field]=e;
if (throw_err===false){
return {error:e,invalid_fields,object:null};
}
const error=new Error(e);
error.json={error:e,invalid_fields,object:null};
throw error;
}
const check_type=(object,obj_key,scheme_item,type)=>{
if (typeof type==="function"){
return object[obj_key] instanceof type;
}
switch (type){
case "null":
return object[obj_key]==null;
case "array":{
if (Array.isArray(object[obj_key])===false){
return false;
}
if (scheme_item.scheme||scheme_item.value_scheme){
try {
object[obj_key]=vlib.scheme.verify({
object:object[obj_key],
scheme:scheme_item.scheme,
value_scheme:scheme_item.value_scheme,
check_unknown,
parent:`${parent}${obj_key}.`,
error_prefix,
throw_err:true,
});
}catch (e){
if (!throw_err&&e.json){return e.json;}
else {throw e;}
}
}
if (typeof scheme_item.min_length==="number"&&object[obj_key].length<scheme_item.min_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object[obj_key].length}], the minimum length is [${scheme_item.min_length}].`,field);
}
if (typeof scheme_item.max_length==="number"&&object[obj_key].length>scheme_item.max_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid array length [${object[obj_key].length}], the maximum length is [${scheme_item.max_length}].`,field);
}
return true;
}
case "object":{
if (typeof object[obj_key]!=="object"||object[obj_key]==null){
return false;
}
if (scheme_item.scheme||scheme_item.value_scheme){
try {
object[obj_key]=vlib.scheme.verify({
object:object[obj_key],
scheme:scheme_item.scheme,
value_scheme:scheme_item.value_scheme,
check_unknown,
parent:`${parent}${obj_key}.`,
error_prefix,
throw_err:true,
});
}catch (e){
if (!throw_err&&e.json){return e.json;}
else {throw e;}
}
}
return true;
}
case "string":{
if (typeof object[obj_key]!=="string"&&!(object[obj_key] instanceof String)){
return false;
}
if (scheme_item.allow_empty!==true&&object[obj_key].length===0){
return 1;
}
if (typeof scheme_item.min_length==="number"&&object[obj_key].length<scheme_item.min_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object[obj_key].length}], the minimum length is [${scheme_item.min_length}].`,field);
}
if (typeof scheme_item.max_length==="number"&&object[obj_key].length>scheme_item.max_length){
const field=`${parent}${obj_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid string length [${object[obj_key].length}], the maximum length is [${scheme_item.max_length}].`,field);
}
}
default:
if (type!==typeof object[obj_key]){
return false;
}
if (type==="string"&&scheme_item.allow_empty!==true&&object[obj_key].length===0){
return 1;
}
return true;
}
}
const verify_value_scheme=(scheme_item,key,object,value_scheme_key=undefined)=>{
if (typeof scheme_item.preprocess==="function"){
const res=scheme_item.preprocess(object[key],object,key);
if (res!==undefined){
object[key]=res;
}
}
if (scheme_item.type&&scheme_item.type!=="any"){
const is_required=scheme_item.required??true;
if (scheme_item.default===null&&object[key]==null){
}
else if (Array.isArray(scheme_item.type)){
let correct_type=false;
let is_empty=false;
for (let i=0;i<scheme_item.type.length;i++){
const res=check_type(object,key,scheme_item,scheme_item.type[i]);
if (typeof res==="object"){
return res;
}
else if (res===true){
correct_type=true;
break;
}
else if (res===1){
correct_type=true;
is_empty=true;
break;
}
}
if (correct_type===false){
const field=`${parent}${value_scheme_key||key}`;
const current_type=vlib.scheme.value_type(object[key]);
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${vlib.scheme.type_error_str(scheme_item,"")}.`,field);
}
else if (is_empty&&is_required&&scheme_item.default!==""){
const field=`${parent}${value_scheme_key||key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`,field);
}
}
else {
const res=check_type(object,key,scheme_item,scheme_item.type);
if (typeof res==="object"){
return res;
}
else if (res===false){
const field=`${parent}${value_scheme_key||key}`;
const current_type=vlib.scheme.value_type(object[key]);
return throw_err_h(`${error_prefix}Attribute "${field}" has an invalid type "${current_type}", the valid type is ${vlib.scheme.type_error_str(scheme_item,"")}.`,field);
}
else if (res===1&&is_required&&scheme_item.default!==""){
const field=`${parent}${value_scheme_key||key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" is an empty string.`,field);
}
}
}
if (scheme_item.enum){
if (!scheme_item.enum.includes(object[key])){
const field=`${parent}${value_scheme_key||key}`;
const joined=scheme_item.enum.map(item=>{
if (item==null){
return 'null';
}else if (typeof item!=="string"&&!(item instanceof String)){
return item.toString();
}
return `"${item.toString()}"`;
}).join(", ");
return throw_err_h(`${error_prefix}Attribute "${field}" must be one of the following enumerated values [${joined}].`,field);
}
}
if (typeof scheme_item.verify==="function"){
const err=scheme_item.verify(object[key],object,key);
if (err){
return throw_err_h(`${error_prefix}${err}`,`${parent}${value_scheme_key||key}`);
}
}
if (typeof scheme_item.callback==="function"){
let stack=new Error().stack.split('\n');
let last=-1;
for (let i=0;i<stack.length;i++){
if (stack[i].includes('at verify_value_scheme ')&&stack[i].includes('/vlib.js')){
last=i;
}
}
if (last!==-1){
stack=stack.slice(last+1);
}
console.warn(`${vlib.colors.red}Warning${vlib.colors.end}: [vlib.scheme.verify]: Attribute "callback" is deprecated and replaced by attribute "verify" and will be removed in future versions.\n${stack.join('\n')}`);
const err=scheme_item.callback(object[key],object,key);
if (err){
return throw_err_h(`${error_prefix}${err}`,`${parent}${value_scheme_key||key}`);
}
}
if (typeof scheme_item.postprocess==="function"){
const res=scheme_item.postprocess(object[key],object,key);
if (res!==undefined){
object[key]=res;
}
}
}
if (Array.isArray(object)){
scheme=value_scheme;
if (scheme!=null){
const scheme_item=vlib.scheme.init_scheme_item(scheme);
for (let index=0;index<object.length;index++){
const err=verify_value_scheme(scheme_item,index,object);
if (err){return err;}
}
}
}
else {
if (value_scheme!=null){
const scheme_item=vlib.scheme.init_scheme_item(value_scheme);
const keys=Object.keys(object);
for (let i=0;i<keys.length;i++){
const err=verify_value_scheme(scheme_item,keys[i],object);
if (err){return err;}
}
}
else {
if (check_unknown){
const object_keys=Object.keys(object);
for (let x=0;x<object_keys.length;x++){
if (object_keys[x] in scheme===false){
const field=`${parent}${object_keys[x]}`;
return throw_err_h(`${error_prefix}Attribute "${field}" is not a valid attribute name.`,field);
}
}
}
const scheme_keys=Object.keys(scheme);
for (let scheme_index=0;scheme_index<scheme_keys.length;scheme_index++){
const scheme_key=scheme_keys[scheme_index];
let scheme_item=vlib.scheme.init_scheme_item(scheme[scheme_key],scheme,scheme_key);
if (typeof scheme_item.alias==="string"){
scheme_item=vlib.scheme.init_scheme_item(scheme[scheme_item.alias],scheme,scheme_item.alias);
}
if (scheme_key in object===false){
if (scheme_item.default!==undefined){
if (typeof scheme_item.default==="function"){
object[scheme_key]=scheme_item.default(object);
}else {
object[scheme_key]=scheme_item.default;
}
}
else {
if (scheme_item.required===false){
continue;
}
else if (typeof scheme_item.required==="function"){
const required=scheme_item.required(object);
if (required){
const field=`${parent}${scheme_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${vlib.scheme.type_error_str(scheme_item)}.`,field);
}
}else {
const field=`${parent}${scheme_key}`;
return throw_err_h(`${error_prefix}Attribute "${field}" should be a defined value${vlib.scheme.type_error_str(scheme_item)}.`,field);
}
}
continue;
}
const err=verify_value_scheme(scheme_item,scheme_key,object);
if (err){return err;}
}
}
}
if (throw_err===false){
return {error:null,invalid_fields:{},object};
}
return object;
}
vlib.scheme._type_string=function(type=[],prefix=""){
if (typeof type==="string"){
return `${prefix}"${type}"`;
}
if (Array.isArray(type)&&type.length>0){
let str=prefix;
for (let i=0;i<type.length;i++){
if (typeof type[i]==="function"){
try {
str+=`"${type[i].name}"`
}catch (e){
str+=`"${type[i]}"`
}
}else {
str+=`"${type[i]}"`
}
if (i===type.length-2){
str+=" or "
}else if (i<type.length-2){
str+=", "
}
}
return str;
}
return "";
}
vlib.scheme.throw_undefined=function(name,type,throw_err=true){
if (typeof name==="object"&&name!=null){
({
name,
type=[],
throw_err=true,
}=name);
}
const err=`Argument "${name}" should be a defined value${vlib.scheme._type_string(type," of type ")}.`
if (throw_err){
throw new Error(err);
}
return err;
}
vlib.scheme.throw_invalid_type=function(
name,
value,
type=[],
throw_err=true,
){
if (typeof name==="object"&&name!=null){
({
name,
value,
type=[],
throw_err=true,
}=name);
}
const err=`Invalid type "${vlib.scheme.value_type(value)}" for argument "${name}${vlib.scheme._type_string(type,", the valid type is ")}.`
if (throw_err){
throw new Error(err);
}
return err;
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
minute_start(){
const date=new D(this.getTime())
date.setSeconds(0);
date.setMilliseconds(0);
return date;
}
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
increment({seconds=0,minutes=0,hours=0,days=0,weeks=0,months=0,years=0}){
const date=new D(this.getTime());
if (seconds>0)date.setSeconds(date.getSeconds()+seconds);
if (minutes>0)date.setMinutes(date.getMinutes()+minutes);
if (hours>0)date.setHours(date.getHours()+hours);
if (days>0||weeks>0)date.setDate(date.getDate()+days+weeks*7);
if (months>0)date.setMonth(date.getMonth()+months);
if (years>0)date.setFullYear(date.getFullYear()+years);
return date;
}
decrement({seconds=0,minutes=0,hours=0,days=0,weeks=0,months=0,years=0}){
const date=new D(this.getTime());
if (seconds>0)date.setSeconds(date.getSeconds()-seconds);
if (minutes>0)date.setMinutes(date.getMinutes()-minutes);
if (hours>0)date.setHours(date.getHours()-hours);
if (days>0||weeks>0)date.setDate(date.getDate()-(days+weeks*7));
if (months>0)date.setMonth(date.getMonth()-months);
if (years>0)date.setFullYear(date.getFullYear()-years);
return date;
}
}
vlib.Path=class Path{
constructor(path,clean=true){
if (path==null){
throw Error(`Invalid path "${path}".`);
}
else if (path instanceof vlib.Path){
this._path=path._path;
}else {
path=path.toString();
if (clean&&path.length>0){
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
if (this.stat.isDirectory()){
let size=0;
function calc(path){
const stat=libfs.statSync(path);
if (stat.isFile()){
size+=stat.size;
}else if (stat.isDirectory()){
libfs.readdirSync(path).iterate(file=>calc(`${path}/${file}`));
}else {
}
}
calc(this._path);
return size;
}else {
return this.stat.size;
}
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
async disk_usage(){
if (!this.is_dir()){
throw new Error(`File path "${this._path}" is not a directory.`);
}
return new Promise((resolve,reject)=>{
diskusagelib.check(this._path,(err,info)=>{
if (err){
reject(err);
return;
}
resolve(info);
});
});
}
async available_space(){
if (!this.is_dir()){
throw new Error(`File path "${this._path}" is not a directory.`);
}
return new Promise((resolve,reject)=>{
diskusagelib.check(this._path,(err,info)=>{
if (err){
reject(err);
return;
}
resolve(info.available);
});
});
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
if (!ext){
return name;
}
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
if (destination instanceof Path){
destination=destination._path;
}
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
async del({recursive=false}={}){
return new Promise((resolve,reject)=>{
if (this.exists()){
if (this.is_dir()){
libfs.rm(this._path,{recursive},(err)=>{
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
del_sync({recursive=false}={}){
if (this.exists()){
if (this.is_dir()){
libfs.rmSync(this._path,{recursive});
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
}else if (type==="array"||type==="object"||type==="json"){
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
}else if (type==="array"||type==="object"||type==="json"){
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
async paths({
recursive=false,
absolute=true,
exclude=[],
}={}){
if (typeof arguments[0]==="boolean"){
recursive=arguments[0];
absolute=true;
exclude=[];
}
for (let i=0;i<exclude.length;i++){
let path=new vlib.Path(exclude[i]);
if (path.exists()){
path=path.abs();
}else {
if (this.join(exclude[i], false).exists()){
path=this.join(exclude[i], false).abs();
}
}
exclude[i]=path.str();
}
return new Promise(async (resolve,reject)=>{
if (!this.is_dir()){
return reject(`Path "${this._path}" is not a directory.`);
}
if (recursive===false){
libfs.readdir(this._path,(err,files)=>{
if (err){
reject(err);
}else {
const list=[];
files.iterate(name=>{
const path=this.join(name);
if (exclude.length===0||!exclude.includes(path.str())){
list.append(absolute?path:name)
}
})
resolve(list);
}
});
}else {
const files=[];
const traverse=(path,relative_path)=>{
return new Promise((resolve,reject)=>{
libfs.readdir(path._path, async (err,children)=>{
if (err){
reject(err);
}else {
let err=null;
for (let i=0;i<children.length;i++){
const child=path.join(children[i]);
if (exclude.length>0&&exclude.includes(child.str())){
continue;
}
const relative_child=absolute?null :relative_path.join(children[i]);
files.push(absolute
?child
:relative_child
);
if (child.is_dir()){
try {
await traverse(child,relative_child);
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
await traverse(this,absolute?null :new vlib.Path(""));
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
async truncate(offset){
return new Promise(async (resolve,reject)=>{
libfs.truncate(this._path,offset,(err)=>{
if (err){
return reject(err);
}
resolve();
});
})
}
}
vlib.Cache=class Cache{
constructor({
limit=null,
ttl=null,
ttl_interval=10000,
}){
this.limit=limit;
this.ttl=ttl;
this.map=new Map();
this.last_access_times=new Map();
this.cleanup_interval_id=null;
if (this.ttl!==null){
this._start_cleanup_interval(ttl_interval);
}
}
_start_cleanup_interval(ttl_interval){
this.cleanup_interval_id=setInterval(()=>{
const now=Date.now();
for (let [key,last_access_time] of this.last_access_times){
if (now-last_access_time>this.ttl){
this.delete(key);
}
}
},ttl_interval);
}
_stop_cleanup_interval(){
if (this.cleanup_interval_id!==null){
clearInterval(this.cleanup_interval_id);
this.cleanup_interval_id=null;
}
}
_check_and_remove_oldest(){
if (this.limit!==null&&this.map.size>this.limit){
const oldest_key=this.map.keys().next().value;
this.delete(oldest_key);
}
}
_update_last_access_time(key){
this.last_access_times.set(key,Date.now());
}
has(key){
return this.map.has(key);
}
set(key,value){
this.map.set(key,value);
this._update_last_access_time(key);
this._check_and_remove_oldest();
}
get(key){
if (this.map.has(key)){
this._update_last_access_time(key);
return this.map.get(key);
}
return undefined;
}
delete(key){
const deletion_result=this.map.delete(key);
this.last_access_times.delete(key);
return deletion_result;
}
clear(){
this._stop_cleanup_interval();
this.map.clear();
this.last_access_times.clear();
}
keys(){
return this.map.keys();
}
values(){
return this.map.values();
}
};
vlib.colors=class Colors{
static black="\u001b[30m";
static red="\u001b[31m";
static red_bold="\u001b[31m\u001b[1m";
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
Colors.red_bold="\u001b[31m\u001b[1m";
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
Colors.red_bold="";
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
vlib.color={
black:(data)=>`${vlib.colors.black}${data}${vlib.colors.end}`,
red:(data)=>`${vlib.colors.red}${data}${vlib.colors.end}`,
red_bold:(data)=>`${vlib.colors.red_bold}${data}${vlib.colors.end}`,
green:(data)=>`${vlib.colors.green}${data}${vlib.colors.end}`,
yellow:(data)=>`${vlib.colors.yellow}${data}${vlib.colors.end}`,
blue:(data)=>`${vlib.colors.blue}${data}${vlib.colors.end}`,
magenta:(data)=>`${vlib.colors.magenta}${data}${vlib.colors.end}`,
cyan:(data)=>`${vlib.colors.cyan}${data}${vlib.colors.end}`,
gray:(data)=>`${vlib.colors.gray}${data}${vlib.colors.end}`,
bold:(data)=>`${vlib.colors.bold}${data}${vlib.colors.end}`,
italic:(data)=>`${vlib.colors.italic}${data}${vlib.colors.end}`,
end:(data)=>`${vlib.colors.end}${data}${vlib.colors.end}`,
}
vlib.print=function(...args){
console.log(args.join(""));
}
vlib.printe=function(...args){
console.error(args.join(""));
}
vlib.print_marker=function(...args){
vlib.print(vlib.colors.blue,">>> ",vlib.colors.end, ...args);
}
vlib.print_warning=function(...args){
vlib.print(vlib.colors.yellow,">>> ",vlib.colors.end, ...args);
}
vlib.print_error=function(...args){
vlib.printe(vlib.colors.red,">>> ",vlib.colors.end, ...args);
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
resolve(this.exit_status);
}
});
this.proc.on('close',(code)=>{
if (this.debug&&closed===1){
console.log(`Child process exited with code ${code}.`);
}
++closed;
if (closed==2){
resolve(this.exit_status);
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
vlib.TimeLimiter=class TimeLimiter{
constructor({
duration=60*1000,
limit=10,
}){
this._duration=duration;
this._limit=limit;
this._counts=0;
this._expiration=Date.now()+this._duration;
}
limit(){
const now=Date.now();
if (now>this._expiration){
this._expiration=now+this._duration;
this._counts=0;
}
++this._counts;
return this._counts<this._limit;
}
}
const is_root=libos.userInfo().uid===0;
vlib.Daemon=class Daemon{
constructor({
name=null,
user=null,
group=null,
command=null,
args=[],
cwd=null,
env={},
description=null,
auto_restart=false,
auto_restart_limit=-1,
auto_restart_delay=-1,
logs=null,
errors=null,
}){
if (typeof name!=="string"){throw new Error(`Parameter "name" must be a defined value of type "string", not "${typeof name}".`);}
if (typeof user!=="string"){throw new Error(`Parameter "user" must be a defined value of type "string", not "${typeof user}".`);}
if (typeof command!=="string"){throw new Error(`Parameter "command" must be a defined value of type "string", not "${typeof command}".`);}
if (typeof description!=="string"){throw new Error(`Parameter "description" must be a defined value of type "string", not "${typeof description}".`);}
this.name=name;
this.user=user;
this.group=group;
this.command=command;
this.args=args;
this.cwd=cwd;
this.env=env;
this.desc=description;
this.auto_restart=auto_restart;
this.auto_restart_limit=auto_restart_limit;
this.auto_restart_delay=auto_restart_delay;
this.logs=logs;
this.errors=errors;
this.path="";
this.proc=new vlib.Proc();
this.assign_path_h();
}
assign_path_h(){
if (process.platform==='darwin'){
this.path=new vlib.Path(`/Library/LaunchDaemons/${this.name}.plist`);
}else if (process.platform==='linux'){
this.path=new vlib.Path(`/etc/systemd/system/${this.name}.service`);
}else {
throw new Error(`Operating system "${process.platform}" is not yet supported.`);
}
}
create_h(){
if (process.platform==='darwin'){
let data="";
data+=
"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+"\n"+
"<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">"+"\n"+
"<plist version=\"1.0\">"+"\n"+
"<dict>"+"\n"+
"    <key>Label</key>"+"\n"+
"    <string>"+this.name+"</string>"+"\n"+
"    <key>UserName</key>"+"\n"+
"    <string>"+this.user+"</string>"+"\n"+
"";
data+=
"	<key>ProgramArguments</key>"+"\n"+
"	<array>"+"\n"+
"		<string>"+this.command+"</string>"+"\n";
this.args.iterate((i)=>{
data+="		<string>"+i+"</string>"+"\n";
})
data+=
"	</array>"+"\n";
if (this.group){
data+=
"    <key>GroupName</key>"+"\n"+
"    <string>"+this.group+"</string>"+"\n"+
"";
}
if (this.auto_restart){
data+=
"    <key>StartInterval</key>"+"\n"+
"    <integer>"+(this.auto_restart_delay==-1?3:this.auto_restart_delay)+"</integer>"+"\n"+
"";
}
if (this.logs){
data+=
"    <key>StandardOutPath</key>"+"\n"+
"    <string>"+this.logs+"</string>"+"\n"+
"";
}
if (this.errors){
data+=
"    <key>StandardErrorPath</key>"+"\n"+
"    <string>"+this.errors+"</string>"+"\n"+
"";
}
if (this.cwd){
data+=`<key>WorkingDirectory</key>`
data+=`<string>${this.cwd}</string>`
}
data+=
"</dict>"+"\n"+
"</plist>"+"\n";
return data;
}
else if (process.platform==='linux'){
let data="";
data+=
"[Unit]"+"\n"+
"Description="+this.desc+"\n"+
"After=network.target"+"\n"+
"StartLimitIntervalSec=0"+"\n"+
""+"\n"+
"[Service]"+"\n"+
"User="+this.user+"\n"+
"Type=simple"+"\n"+
"ExecStart="+this.command+" ";
this.args.iterate((i)=>{
data+="\""+i+"\" ";
});
data+="\n";
Object.keys(this.env).iterate((key)=>{
data+="Environment=\""+key+"="+this.env[key]+"\"\n";
})
if (this.cwd){
data+=`WorkingDirectory=${this.cwd}`
}
if (this.group){
data+=
"Group="+this.group+"\n";
}
if (this.auto_restart){
data+=
"Restart=always"+"\n"+
"RestartSec=1"+"\n"+
"";
if (this.auto_restart_limit!=-1){
data+=
"StartLimitBurst="+this.auto_restart_limit+"\n";
}
if (this.auto_restart_delay!=-1){
data+=
"StartLimitIntervalSec="+this.auto_restart_delay+"\n";
}
}
data+=
""+"\n"+
"[Install]"+"\n"+
"WantedBy=multi-user.target"+"\n";
return data;
}else {
throw new Error(`Operating system "${process.platform}" is not yet supported.`);
}
}
async load_h(){
if (process.platform==='darwin'){
const status=await this.proc.start({command:`launchctl load ${this.path.str()}`})
if (status!=0){
throw new Error("Failed to reload the daemon.");
}
}else {
throw new Error(`Operating system "${process.platform}" is not yet supported.`);
}
}
async reload_h(){
if (process.platform==='darwin'){
const status=await this.proc.start({
command:`launchctl unload ${this.path.str()} && launchctl load ${this.path.str()}`
})
if (status!=0){
throw new Error("Failed to reload the daemon.");
}
}else if (process.platform==='linux'){
const status=await this.proc.start({
command:`systemctl daemon-reload`
})
if (status!=0){
throw new Error("Failed to reload the daemon.");
}
}else {
throw new Error(`Operating system "${process.platform}" is not yet supported.`);
}
}
exists(){
if (!is_root){
throw new Error("Root privileges required.");
}
return this.path.exists();
}
async create(){
if (!is_root){
throw new Error("Root privileges required.");
}
if (this.path.exists()){
throw new Error(`Daemon "${this.path.str()}" already exists.`);
}
this.path.save_sync(this.create_h());
if (process.platform==='darwin'){
await this.load_h();
}
}
async update(){
if (!is_root){
throw new Error("Root privileges required.");
}
if (!this.path.exists()){
throw new Error(`Daemon "${this.path.str()}" does not exist.`);
}
this.path.save_sync(this.create_h());
await this.reload_h();
}
async remove(){
if (!is_root){
throw new Error("Root privileges required.");
}
this.path.del_sync();
}
async start(){
if (!is_root){
throw new Error("Root privileges required.");
}
if (!this.path.exists()){
throw new Error(`Daemon "${this.path.str()}" does not exist.`);
}
let command="";
if (process.platform==='linux'){
command=`systemctl start ${this.name}`;
}else if (process.platform==='darwin'){
command=`launchctl start ${this.name}`;
}
const status=await this.proc.start({command})
if (status!=0){
throw new Error("Failed to start the daemon.");
}
}
async stop(){
if (!is_root){
throw new Error("Root privileges required.");
}
if (!this.path.exists()){
throw new Error(`Daemon "${this.path.str()}" does not exist.`);
}
let command="";
if (process.platform==='linux'){
command=`systemctl stop ${this.name}`;
}else if (process.platform==='darwin'){
command=`launchctl stop ${this.name}`;
}
const status=await this.proc.start({command})
if (status!=0){
throw new Error("Failed to stop the daemon.");
}
}
async restart(){
if (!is_root){
throw new Error("Root privileges required.");
}
if (!this.path.exists()){
throw new Error(`Daemon "${this.path.str()}" does not exist.`);
}
let command="";
if (process.platform==='linux'){
command=`systemctl restart ${this.name}`;
}else if (process.platform==='darwin'){
command=`launchctl stop ${this.name} && launchctl start ${this.name}`;
}
const status=await this.proc.start({command})
if (status!=0){
throw new Error("Failed to restart the daemon.");
}
}
async is_running(){
if (!is_root){
throw new Error("Root privileges required.");
}
let command;
if (process.platform==='darwin'){
command=`launchctl list | grep ${this.name}`;
}else if (process.platform==='linux'){
command=`systemctl is-active ${this.name}`;
}else {
throw new Error("Failed to restart the daemon.");
}
const status=await this.proc.start({command})
if (status!=0){
return false;
}else if (process.platform==='linux'){
return true;
}
return this.proc.out.split("\t")[1]=="0";
}
async tail(lines=100){
if (!is_root){
throw new Error("Root privileges required.");
}
if (!this.path.exists()){
throw new Error(`Daemon "${this.path.str()}" does not exist.`);
}
let command="";
if (process.platform==='linux'){
throw new Error(`Operating system "${process.platform}" is not yet supported.`);
}else if (process.platform==='darwin'){
command=`sudo journalctl -u ${this.name}.service --no-pager  -n ${lines}`;
}
const status=await this.proc.start({command})
if (status!=0){
throw DaemonError("Failed to tail the daemon.");
}
return this.proc.out;
}
};
vlib.system={};
vlib.system.format_bytes=(bytes)=>{
if (bytes>1024*1024*1024){
return `${(bytes/(1024*1024*1024)).toFixed(2)}GB`;
}
else if (bytes>1024*1024){
return `${(bytes/(1024*1024)).toFixed(2)}MB`;
}
else if (bytes>1024){
return `${(bytes/1024).toFixed(2)}KB`;
}
return `${(bytes).toFixed(2)}B`;
}
vlib.system.cpu_usage=()=>{
const cpus=libos.cpus();
let total_time=0;
let total_used=0;
cpus.forEach(cpu=>{
const cpu_total=Object.values(cpu.times).reduce((acc,tv)=>acc+tv,0);
const cpu_used=cpu_total-cpu.times.idle;
total_time+=cpu_total;
total_used+=cpu_used;
});
return (total_used/total_time)*100;
}
vlib.system.memory_usage=(format=true)=>{
const total=libos.totalmem();
const free=libos.freemem();
const used=total-free;
return {
total:format?vlib.system.format_bytes(total):total,
used:format?vlib.system.format_bytes(used):used,
free:format?vlib.system.format_bytes(free):free,
used_percentage:(used/total)*100,
}
}
vlib.system.network_usage=async (format=true)=>{
const stats=await sysinfo.networkStats();
let sent=0;
let received=0;
stats.forEach(iface=>{
sent+=iface.tx_bytes;
received+=iface.rx_bytes;
});
return {
sent:format?vlib.system.format_bytes(sent):sent,
received:format?vlib.system.format_bytes(received):received,
};
}
vlib.Logger=class Logger{
constructor({
log_level=0,
log_path=null,
error_path=null,
threading=false,
max_mb=null,
}){
this.log_level=log_level;
this.log_path=log_path;
this.error_path=error_path;
this.log_stream=undefined;
this.error_stream=undefined;
this.threading=threading;
this.max_mb=max_mb;
this.thread=":";
if (this.threading){
this.thread=libcluster.worker?` [thread-${libcluster.worker.id}]${parseInt(libcluster.worker.id)<10?":":":"}`:" [thread-0]:";
}
if (this.log_path&&this.error_path){
this.assign_paths(this.log_path, this.error_path);
}
}
assign_paths(log_path,error_path){
this.log_path=new vlib.Path(log_path);
this.error_path=new vlib.Path(error_path);
this.log_stream=libfs.createWriteStream(this.log_path.str(),{flags:'a'});
this.error_stream=libfs.createWriteStream(this.error_path.str(),{flags:'a'});
}
log(level, ...args){
if (level>this.log_level){return ;}
let msg=new vlib.Date().format("%d-%m-%y %H:%M:%S");
msg+=`${this.thread} `;
for (let i=0;i<args.length;i++){
msg+=args[i]+" ";
}
console.log(msg);
if (this.log_stream){
msg+='\n';
this.log_stream.write(msg);
if (this.max_mb!=null&&this._random(1,100)<=1){
this._truncate(this.log_path).catch(console.error)
}
}
}
error(prefix,err){
let msg;
if (err==null){
err=prefix;
prefix="";
}
if (typeof err==="string"){
msg=`${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} ${prefix}${err}`;
}else if (err!=null){
msg=`${new vlib.Date().format("%d-%m-%y %H:%M:%S")}${this.thread} ${prefix}${err.stack||err.message}`;
}
if (msg){
console.error(msg);
if (this.error_stream){
msg+='\n';
this.error_stream.write(msg);
if (this.max_mb!=null&&this._random(1,100)<=1){
this._truncate(this.error_path).catch(console.error)
}
}
}
}
async _truncate(path){
return new Promise(async (resolve,reject)=>{
try {
path.reset();
if (path.stat.size/1024/1024<this.max_mb){
return resolve();
}
const max_kb=this.max_mb*1024;
const keep_mb=100>max_kb?parseInt(max_kb*0.05):100;
await path.truncate(Math.max(0,path.stat.size-keep_mb));
resolve();
}catch (e){
reject(e);
}
});
}
_random(min=1,max=100){
return Math.floor(Math.random()*(max-min+1))+min;
}
};
vlib.Performance=class Performance{
constructor(name="Performance"){
this.name=name;
this.times={};
this.now=Date.now();
}
start(){
this.now=Date.now();
return this.now;
}
end(id,start){
if (start==null){
start=this.now;
}
if (this.times[id]===undefined){
this.times[id]=0;
}
this.times[id]+=Date.now()-start;
this.now=Date.now();
return this.now;
}
dump(){
let results=Object.entries(this.times);
results.sort((a,b)=>b[1]-a[1]);
results=Object.fromEntries(results);
console.log(`${this.name}:`);
Object.keys(results).iterate((id)=>{
console.log(` * ${id}: ${results[id]}`);
});
}
}
vlib.Mutex=class Mutex{
constructor(){
this.locked=false;
this.queue=[];
}
async lock(){
if (!this.locked){
this.locked=true;
}else {
return new Promise((resolve)=>{
this.queue.push(resolve);
});
}
}
unlock(){
if (this.queue.length>0){
const next_resolve=this.queue.shift();
next_resolve();
}else {
this.locked=false;
}
}
}
vlib.unit_tests={};
vlib.unit_tests._create_unit_test=(func,id,debug=0)=>{
return function (args){
if (debug>0||debug===args.id){console.log(vlib.colors.blue+id+vlib.colors.end+":");}
return func({
id,
vlib,
hash:vlib.utils.hash,
debug:function (level, ...args){
if (debug>=level||debug===id){console.log(" *",...args);}
},
...args,
})
}
}
vlib.unit_tests.perform=async function({
name="Unit Tests",
unit_tests={},
target=null,
stop_on_failure=false,
debug_on_failure=false,
args={},
debug=0,
}){
console.log(`Commencing ${name} unit tests.`)
let res,failed=0,succeeded=0;
if (unit_tests){
if (target!=null){
if (unit_tests[target]===undefined){
throw new Error(`Unit test "${target}" was not found`);
}
const unit_test=unit_tests[target]
unit_tests={}
unit_tests[target]=unit_test;
}
const ids=Object.keys(unit_tests);
for (const id of ids){
let res=vlib.unit_tests._create_unit_test(unit_tests[id],id,debug_on_failure?0:debug)(args);
if (res instanceof Promise){res=await res;}
if (res===false){
if (debug_on_failure){
const res=vlib.unit_tests._create_unit_test(unit_tests[id],id,debug)(args);
if (res instanceof Promise){await res;}
}
console.log(` * ${id} ${vlib.colors.red}${vlib.colors.bold}failed${vlib.colors.end}`);
if (stop_on_failure){return ;}
++failed;
}else {
console.log(` * ${id} ${vlib.colors.green}${vlib.colors.bold}succeeded${vlib.colors.end}`);
++succeeded;
}
}
}
if (failed===0){
console.log(` * All unit tests ${vlib.colors.green+vlib.colors.bold}passed${vlib.colors.end} successfully.`);
}else {
console.log(` * Encountered ${failed===0?vlib.colors.green:vlib.colors.red}${vlib.colors.bold}${failed}${vlib.colors.end} failed unit tests.`);
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
name="CLI",
description=null,
version=null,
notes=null,
commands=[],
start_index=2,
}={}){
this.name=name;
this.description=description;
this.version=version;
this.commands=commands;
this.notes=notes;
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
let str="";
for (let i=0;i<err.length;i++){
if (err[i].stack){
str+="\n"+err[i].stack;
}else {
str+=err[i].toString();
}
}
err=str.trim();
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
docs+="\n";
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
if (this.description){
docs+=`\nDescription:\n    ${this.description.split("\n").join("\n    ")}\n`;
}
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
if (docs.charAt(docs.length-1)==="\n"){
docs=docs.substr(0,docs.length-1);
}
if (this.notes&&this.notes.length>0){
docs+=`\nNotes:\n`;
this.notes.iterate((note)=>{
docs+=` * ${note}\n`;
})
}
if (docs.charAt(docs.length-1)==="\n"){
docs=docs.substr(0,docs.length-1);
}
}
else {
if (this.description){
docs+=this.description+"\n";
}
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
if (arg.ignore===true){
return ;
}
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
vlib.cli={};
vlib.cli.get=function({id,index=null,type=null,def=null,exclude_args=true}){
if (this._cli===undefined){
this._cli=new vlib.CLI();
}
return this._cli.get({id,index,type,def,exclude_args}).value;
}
vlib.cli.present=function(id){
if (this._cli===undefined){
this._cli=new vlib.CLI();
}
return this._cli.present(id);
}
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
http2=false,
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
json:()=>JSON.parse(body),
});
}else {
setTimeout(()=>resolve({
body,
error,
status,
headers:res_headers,
json:()=>JSON.parse(body),
}),delay)
}
}
if (!http2){
options={
hostname:host,
port:port,
path:endpoint,
method:method,
headers:headers,
rejectUnauthorized:reject_unauthorized,
};
const req=libhttps.request(options,(res)=>{
status=res.statusCode;
res_headers=res.headers;
const content_encoding=res_headers['content-encoding'];
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
res.on("end",()=>{
on_end()
})
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
}
else {
const session=libhttp2.connect(`https://${host}`,{
rejectUnauthorized:reject_unauthorized,
settings:{
timeout:60000,
},
});
session.on('error',(e)=>{
error=e;
if (error.response){
status=error.response.statusCode;
}
on_end()
session.close();
});
const req=session.request({
':method':method,
':path':endpoint,
...headers
});
let decompress_stream;
req.on('response',(headers,flags)=>{
status=headers[':status'];
res_headers=headers;
const content_encoding=headers['content-encoding'];
if (content_encoding==='gzip'||content_encoding==='deflate'){
if (content_encoding==='gzip'){
decompress_stream=zlib.createGunzip();
}else if (content_encoding==='deflate'){
decompress_stream=zlib.createInflate();
}
}
let stream=req;
if (decompress_stream){
stream=stream.pipe(decompress_stream);
}
let body='';
stream.on('data',(chunk)=>{
body+=chunk.toString();
});
stream.on('end',()=>{
on_end();
session.close();
});
});
req.on('error',(err)=>{
error=err;
on_end();
session.close();
});
console.log("WRITE DATA")
if (params!=null&&method!=='GET'){
req.write(typeof params==='object'?JSON.stringify(params):params);
}
console.log("call req.end()")
}
});
}
const WebSocket=require('ws');
const liburl=require('url');
vlib.websocket={};
vlib.websocket.Server=class Server{
constructor({
ip=null,
port=8000,
https=null,
rate_limit={
limit:5,
interval:60,
},
api_keys=[],
server=null,
}){
this.port=port;
this.https_config=https;
this.server=server;
this.api_keys=api_keys;
this.rate_limit=rate_limit;
this.streams=new Map();
this.commands=new Map();
this.events=new Map();
this.rate_limit_cache=new Map();
}
start(){
if (this.server===null){
if (this.https_config!=null){
this.server=libhttps.createServer(this.https_config,(req,res)=>{
res.writeHead(426,{'Content-Type':'text/plain'});
res.end('This service requires WebSocket protocol.');
});
this.server.__is_https=true;
}else {
this.server=libhttp.createServer((req,res)=>{
res.writeHead(426,{'Content-Type':'text/plain'});
res.end('This service requires WebSocket protocol.');
});
}
}
this.wss=new WebSocket.Server({noServer:true });
this.server.on('upgrade',(request,socket,head)=>{
if (this.rate_limit!==false){
const ip=request.socket.remoteAddress;
const now=Date.now();
if (this.rate_limit_cache.has(ip)){
let data=this.rate_limit_cache.get(ip);
if (now>=data.expiration){
data={
count:0,
expiration:now+this.rate_limit.interval*1000,
};
}
++data.count;
if (data.count>this.rate_limit.limit){
socket.write(`HTTP/1.1 429 Too Many Requests\r\n\r\nRate limit exceeded, please try again in ${parseInt((data.expiration-now)/1000)} seconds.`);
socket.destroy();
return;
}
this.rate_limit_cache.set(ip,data);
}else {
this.rate_limit_cache.set(ip,{
count:1,
expiration:now+this.rate_limit.interval*1000,
});
}
}
const {query}=liburl.parse(request.url, true);
if (this.api_keys.length>0&&!this.api_keys.includes(query.api_key)){
socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
socket.destroy();
return;
}
this.wss.handleUpgrade(request,socket,head,(stream)=>{
this.wss.emit('connection',stream,request);
});
});
this.wss.on('connection',(stream)=>{
stream.id=Math.random().toString(36).substr(2,16);
this.streams.set(stream.id,stream);
stream.messages=new Map();
stream.on('message',(message)=>{
try {
message=libbson.deserialize(message);
}
catch (error){
if (message.toString()==="ping"){
stream.send("pong");
return ;
}
if (this.on_no_json_message!==undefined){
this.on_no_json_message(message);
}
return ;
}
if (message.timestamp==null){
message.timestamp=Date.now();
}
if (message.command!=null&&this.commands.has(message.command)){
this.commands.get(message.command)(stream,message.id,message.data);
}else if (message.id!=null){
stream.messages.set(message.id,message);
}
});
if (this.events.has("open")){
this.events.get("open")(stream);
}
stream.on('close',(code,reason)=>{
stream.connected=false;
if (this.events.has("close")){
this.events.get("close")(stream,code,reason);
}
});
const err_callback=this.events.get("open");
if (err_callback){
stream.on("error",(e)=>err_callback(stream,e));
}
});
if (this.ip){
this.server.listen(this.port, this.ip,()=>{
if (this.events.has("listen")){
this.events.get("listen")(`${this.server.__is_https?"https":"http"}://${this.ip}:${this.port}`);
}
});
}else {
this.server.listen(this.port,()=>{
if (this.events.has("listen")){
this.events.get("listen")(`${this.server.__is_https?"https":"http"}://localhost:${this.port}`);
}
});
}
this._clear_caches();
}
async stop(){
return new Promise((resolve)=>{
clearTimeout(this._clear_caches_timeout);
this.wss.clients.forEach(client=>{
client.close();
});
let closed=0;
this.wss.close(()=>{
++closed;
if (closed===2){resolve();}
});
this.server.close(()=>{
++closed;
if (closed===2){resolve();}
});
})
}
on_event(event,callback){
this.events.set(event,callback);
}
on(command,callback){
this.commands.set(command,callback);
}
async send({stream,command,id,data}){
if (id==null){
id=String.random(32);
}
stream.send(libbson.serialize({
command,
id:id,
data:data,
}))
return id;
}
async await_response({stream,id,timeout=60000,step=10}){
let elpased=0;
return new Promise((resolve,reject)=>{
const wait=()=>{
if (stream.messages.has(id)){
const data=stream.messages.get(id)
stream.messages.delete(id)
return resolve(data);
}else {
elpased+=step;
if (elpased>timeout){
return reject(new Error("Operation timed out."));
}
setTimeout(wait,step);
}
}
wait();
})
}
async request({stream,command,data,timeout=60000}){
const id=await this.send({stream,command,data});
return this.await_response({stream,id,timeout});
}
_clear_caches(client){
const now=Date.now();
for (const [id,client] of this.streams){
if (client.connected){
for (const [msg_id,msg] of client.messages){
if (msg.timestamp&&now>=msg.timestamp+(3600*1000)){
client.messages.delete(msg_id);
}
}
}else {
this.streams.delete(id);
}
}
this._clear_caches_timeout=setTimeout(()=>this._clear_caches(),3600*1000)
}
}
vlib.websocket.Client=class Client{
constructor({
url="wss://localhost:8080",
api_key=null,
reconnect={
interval:10,
max_interval:30000,
},
ping=true,
}){
this.url=url;
this.api_key=api_key;
if (reconnect===false){
this.reconnect=false;
}else {
if (reconnect===true){
reconnect={};
}
this.reconnect=reconnect;
this.reconnect.enabled=true;
this.reconnect.attempts=0;
if (this.reconnect.interval==null){
this.reconnect.interval=10;
}
if (this.reconnect.max_interval==null){
this.reconnect.max_interval=30000;
}
}
if (ping===true){
this.auto_ping=30000;
}
else if (typeof ping==="number"){
this.auto_ping=ping;
}else {
this.auto_ping=false;
}
this.commands=new Map();
this.events=new Map();
this.messages=new Map();
}
async connect(){
return new Promise((resolve)=>{
this.try_reconnect=this.rate_limit!==false;
this.stream=new WebSocket(this.api_key?`${this.url}?api_key=${this.api_key}`:this.url);
this.stream.on('open',()=>{
this.connected=true;
if (this.try_reconnect){
this.reconnect.attempts=0;
}
if (this.events.has("open")){
this.events.get("open")();
}
resolve();
});
this.stream.on('message',(message)=>{
try {
message=libbson.deserialize(message);
}
catch (error){
if (message.toString()==="pong"){
return ;
}
if (this.on_no_json_message!==undefined){
this.on_no_json_message(message);
}
return ;
}
if (message.command!=null&&this.commands.has(message.command)){
this.commands.get(message.command)(message.id,message.data);
}else if (message.id){
if (message.timestamp==null){
message.timestamp=Date.now();
}
this.messages.set(message.id,message);
}
});
this.stream.on('close',(code,reaseon)=>{
this.connected=false;
if (this.try_reconnect){
if (this.events.has("reconnect")){
this.events.get("reconnect")(code,reaseon);
}
let timeout=Math.min(this.reconnect.interval*Math.pow(2, this.reconnect.attempts), this.reconnect.max_interval);
this.reconnect.attempts++;
setTimeout(()=>this.connect(),timeout);
}else if (this.events.has("close")){
this.events.get("close")(code,reaseon);
}
});
this.stream.on('error',(error)=>{
this.stream.close();
if (this.events.has("error")){
this.events.get("error")(error);
}
});
let ping_every=typeof this.auto_ping==="number"?this.auto_ping:30000
clearTimeout(this.auto_ping_timeout)
const auto_ping=()=>{
if (this.connected){
this.stream.send("ping");
this.auto_ping_timeout=setTimeout(auto_ping,ping_every);
}
}
this.auto_ping_timeout=setTimeout(auto_ping,ping_every)
})
}
disconnect(){
this.try_reconnect=false;
this.stream.close();
clearTimeout(this.auto_ping_timeout)
}
async await_till_connected(timeout=60000){
if (this.connected){return ;}
let step=10;
let elpased=0;
return new Promise((resolve,reject)=>{
const is_connected=()=>{
if (this.connected){
return resolve();
}else {
elpased+=step;
if (elpased>timeout){
return reject(new Error("Timeout."));
}
setTimeout(is_connected,step);
}
}
is_connected();
})
}
on_event(event,callback){
this.events.set(event,callback);
}
on(command,callback){
this.commands.set(command,callback);
}
async send_raw(data){
await this.await_till_connected();
this.stream.send(data)
}
async send({command,id,data}){
await this.await_till_connected();
if (id==null){
id=String.random(32);
}
this.stream.send(libbson.serialize({
command,
id:id,
data:data,
}))
return id;
}
async await_response({id,timeout=60000,step=10}){
let elapsed=0;
return new Promise((resolve,reject)=>{
const wait=()=>{
if (this.messages.has(id)){
const data=this.messages.get(id)
this.messages.delete(id)
return resolve(data);
}else {
elapsed+=step;
if (elapsed>timeout){
return reject(new Error("Operation timed out."));
}
setTimeout(wait,step);
}
}
wait();
})
}
async request({command,data,timeout=60000}){
const id=await this.send({command,data});
return await this.await_response({id,timeout});
}
_clear_caches(client){
const now=Date.now();
for (const [id,client] of this.streams){
if (client.connected){
for (const [msg_id,msg] of client.messages){
if (msg.timestamp&&now>=msg.timestamp+(60*5*1000)){
client.messages.delete(msg_id);
}
}
}else {
this.streams.delete(id);
}
}
this._clear_caches_timeout=setTimeout(()=>this._clear_caches(),60*5*1000)
}
}
vlib.version="1.3.1";
module.exports=vlib;
