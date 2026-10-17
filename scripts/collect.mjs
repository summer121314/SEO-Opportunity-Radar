import{readFileSync,writeFileSync}from'node:fs';
const path='public/data.json',old=JSON.parse(readFileSync(path,'utf8'));
const feeds=[
{source:'Hacker News',url:'https://hn.algolia.com/api/v1/search_by_date?query=AI%20tool&tags=story&hitsPerPage=40'},
{source:'Hacker News',url:'https://hn.algolia.com/api/v1/search_by_date?query=converter&tags=story&hitsPerPage=40'},
{source:'Hacker News',url:'https://hn.algolia.com/api/v1/search_by_date?query=calculator&tags=story&hitsPerPage=40'},
{source:'GitHub',url:'https://api.github.com/search/repositories?q=created:%3E'+new Date(Date.now()-14*86400000).toISOString().slice(0,10)+'+stars:%3E2+topic:productivity&sort=stars&order=desc&per_page=35'}];
const keyword=/\b(ai|agent|workflow|converter|calculator|generator|pdf|csv|tool|automation|transcript|speech|image|video|productivity)\b/i;
const seen=new Set(),items=[];
for(const f of feeds){try{const control=new AbortController();const timer=setTimeout(()=>control.abort(),15000);let res;try{res=await fetch(f.url,{headers:{'User-Agent':'SeoOpportunityRadar/1.0','Accept':'application/json'},signal:control.signal})}finally{clearTimeout(timer)}
if(!res.ok)throw Error('HTTP '+res.status);const d=await res.json();const entries=Array.isArray(d.hits)?d.hits:Array.isArray(d.items)?d.items:[];
for(const x of entries){let title=String(x.title||x.name||'').trim(),link=x.url||x.html_url,created=x.created_at; if(!title||!link||!keyword.test(title))continue;
let url;try{url=new URL(link);if(!['https:','http:'].includes(url.protocol))continue}catch{continue}
const clean=url.origin+url.pathname.replace(/\/$/,'');if(seen.has(clean))continue;seen.add(clean);
const terms=(title.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g)||[]).filter(k=>!['the','for','and','with','from','this','that','github','open'].includes(k));const kws=[...new Set(terms)].slice(0,5);
const kind=/csv|pdf|converter|format/i.test(title)?'文件工具':/calculator|calc/i.test(title)?'计算器':/ai|agent|llm|workflow/i.test(title)?'AI工具':'效率工具';
const date=Date.parse(created||'');items.push({id:clean,title:title.slice(0,170),url:clean,source:f.source,category:kind,keywords:kws,foundAt:Number.isFinite(date)?new Date(date).toISOString():null,score:Math.min(82,25+(x.stargazers_count||0)>30?45:32),evidence:'公开发布线索，未验证自然搜索流量'});if(items.length>=90)break;
}}catch(e){console.warn(f.source,String(e))}}
if(items.length===0){console.log('No verified feed response; retain previous snapshot');process.exit(0)}
const recent=[...items,...(old.items||[])].filter(x=>x&&x.url);const dedup=[...new Map(recent.map(x=>[x.url,x])).values()].slice(0,150);
const before=JSON.stringify((old.items||[]).map(x=>x.url));const after=JSON.stringify(dedup.map(x=>x.url));if(before===after){console.log('No URL changes');process.exit(0)}
writeFileSync(path,JSON.stringify({updatedAt:new Date().toISOString(),items:dedup,disclaimer:'Public product signals, NOT confirmed organic traffic or keyword search volumes. Scores are heuristics.'},null,2)+'\n');console.log('Saved',dedup.length,'items');
