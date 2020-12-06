!function(){"use strict";function e(e){return new Promise(s=>setTimeout(s,e))}function s(e,t){return new Promise((n,r)=>{e(t).then(e=>n(e.body)).catch(a=>{429==a.status?setTimeout(()=>n(s(e,t)),1e3*a.body.retry_after):r(a)})})}const t={getByProps(...e){return this.getModule(s=>e.every(e=>s[e]))},getByValue(e,s){return this.getModule(t=>t[e]==s,!0)},getModule(e,s=!1){let t=this.getModules();for(let n in t){let{exports:r}=t[n];if(r){if(r.__esModule&&r.default&&e(r.default))return s?r:r.default;if(e(r))return r}}},getModules(){let e="webpackmodules";return this._require||(this._require="function"==typeof window.webpackJsonp?window.webpackJsonp([],{[e]:(e,s,t)=>s.default=t},[e]).default:window.webpackJsonp.push([[],{[e]:(e,s,t)=>e.exports=t},[[e]]]).c,delete this._require[e]),this._require}},n=t.getByProps("Inflate").Inflate,r=t.getByProps("getErlpackEncoding").getErlpackEncoding(),a=(t.getByProps("createElement","cloneElement"),t.getByProps("render","findDOMNode"),t.getByProps("getAPIBaseURL")),l=t.getByProps("Permissions","ActivityTypes","StatusTypes"),o=t.getByProps("getCurrentUser"),i=(t.getByProps("getToken"),t.getByProps("getMember")),d=t.getByProps("getChannel"),g=(t.getByProps("getChannels"),t.getByProps("getMessages")),u=t.getByProps("getLastSelectedGuildId"),c=t.getByProps("getLastSelectedChannelId"),h=t.getByProps("getUsers");t.getByProps("receiveMessage","sendBotMessage");const p={hijack:function(){return Promise.all([new Promise(e=>{const s=WebSocket.prototype.send;WebSocket.prototype.send=function(){return this.url.includes("gateway.discord.gg")&&(WebSocket.prototype.send=s,e(this)),s.apply(this,arguments)}}),new Promise(e=>{const s=n.prototype.push;n.prototype.push=function(){return n.prototype.push=s,e(this),s.apply(this,arguments)}})]).then(([e,s])=>{let t=r?new r:{pack:JSON.stringify,unpack:e=>e},n=s.onEnd;return{ws:e,setSpotifyStatus(e={}){this.send({op:3,d:{status:"dnd",since:0,activities:[{type:2,name:"Spotify",assets:{large_image:"spotify:"+e.image},details:e.title,state:e.authors,timestamps:{start:Date.now(),end:Date.now()+864e5},party:null,sync_id:null,flags:48,metadata:{album_id:null,artist_ids:[]}}],afk:!1}})},setVoiceState(e,s,t,n,r){this.send({op:4,d:{guild_id:e,channel_id:s,self_mute:t,self_deaf:n,self_video:r}})},send(s){e.send(t.pack(s))},receive(e){n=s.onEnd,s.onEnd=function(){return this.chunks.map(s=>{e(t.unpack(s))}),n.apply(this,arguments)}},stop(){s.onEnd=n}}})},fetchRelationships:e=>s(a.get,l.Endpoints.USER_RELATIONSHIPS(e)),fetchAllMembers(){console.log(l.Endpoints)},async searchSharedFriends(s){let t=Object.values(p.users),n=[];for(let s of t)s.relationships?n.push(Promise.resolve(s)):(n.push(p.fetchRelationships(s.id).then(e=>(s.relationships=e,s))),await e(25));return Promise.all(n).then(e=>e.filter(({relationships:e})=>e.find(({id:e})=>e===s)))},searchGuildMessages:(e=p.selectedGuildId,t=p.user.id,n=0)=>s(a.get,l.Endpoints.SEARCH_GUILD(e)+`?author_id=${t}&include_nsfw=true&offset=${n}`),searchChannelMessages:(e=p.selectedChannelId,t=p.user.id,n=0)=>s(a.get,l.Endpoints.SEARCH_CHANNEL(e)+`?author_id=${t}&offset=${n}`),async searchAllMessages(e,s,t,n=!0){let r,a=[],l=0;for(;(r=await e(s,t,l)).messages.length&&(a.push(...r.messages),l+=r.messages.length,!(a.length>=1500)););return n?a.map(e=>e.find(e=>e.hit)):a},searchAllGuildMessages:(e=p.selectedGuildId,s=p.user.id,t=!0)=>p.searchAllMessages(p.searchGuildMessages,e,s,t),searchAllChannelMessages:(e=p.selectedChannelId,s=p.user.id,t=!0)=>p.searchAllMessages(p.searchChannelMessages,e,s,t),deleteMessage:(e,t)=>s(a.delete,l.Endpoints.MESSAGES(e)+"/"+t),async deleteSearchMessages(s,t,n){let r=await p.searchAllMessages(s,t,n),a=0;p.progressBar.setSteps(r.length);for(let s of r)p.progressBar.setProgress(++a),console.log(`[DISTOOLS][🗑️] ${a} / ${r.length} messages.`),0!=s.type&&19!=s.type||(await p.deleteMessage(s.channel_id,s.id),await e(150));console.log("Done."),await e(2e3),p.progressBar.setProgress(0)},deleteGuildMessages:(e=p.selectedGuildId,s=p.user.id)=>p.deleteSearchMessages(p.searchGuildMessages,e,s),deleteChannelMessages:(e=p.selectedChannelId,s=p.user.id)=>p.deleteSearchMessages(p.searchChannelMessages,e,s),async fetchAllMessages(e=p.selectedChannelId){let s=[],t=[];do{t.push(...s),s=(await a.get({url:l.Endpoints.MESSAGES(e),query:{before:s[s.length-1].id,limit:100}})).body}while(s.length>0);return t.reverse()},saveMessages(e=p.selectedChannelId){alert("Starting downloading conversation.\nPlease do not click any buttons of the menu !"),p.fetchAllMessages(e).then(s=>{const t=new Map;s=s.map(e=>(t.set(e.author.id,e.author),(e={...e}).author=e.author.id,delete e.channel_id,e)),function(e,s){let t=window.URL.createObjectURL(new Blob([s],{type:"octet/stream"})),n=document.createElement("a");n.href=t,n.download=e,n.style.display="none",n.click(),window.URL.revokeObjectURL(t)}(e+".json",JSON.stringify({channel:e,users:[...t.values()],messages:s}))})},get members(){return p.selectedGuildId?i.getMembers(p.selectedGuildId):d.getChannel(p.selectedChannelId).rawRecipients},get users(){return h.getUsers()},get selectedGuildId(){return u.getGuildId()},get selectedChannelId(){return c.getChannelId()},get selectedChannel(){return d.getChannel(p.selectedChannelId)},get messages(){return g.getMessages(p.selectedChannelId).toArray()},get user(){return o.getCurrentUser()}};p.progressBar=new Proxy({},{get:()=>()=>{}}),window.DISTOOLS=p}();
