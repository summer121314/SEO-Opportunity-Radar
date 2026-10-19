import{readFileSync,writeFileSync}from'node:fs';
const file='public/trends.json',old=JSON.parse(readFileSync(file,'utf8'));
const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(?:amp|lt|gt|quot|apos|#39|#x27);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&#x27;':"'"}[m]));
const get=(xml,tag)=>{const esc=tag.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&');return decode((xml.match(new RegExp('<'+esc+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+esc+'>','i'))||[])[1]||'').trim()};
const categories=[
{re:/\b(csv|pdf|converter|calculator|template|generator|invoice|resume|transcript|transcription|translate|translator|subtitle|schedule|time zone|currency|exchange rate|budget|tax|receipt|passport|visa|map|weather|flight|train)\b|計算|変換|翻訳|履歴書|確定申告|税金|為替|時刻|予約|天気|書類|料金|年金|補助金|申請|履歴|路線|花粉/i,kind:'实用工具'},
{re:/\b(ai|chatbot|agent|voice|photo|image|video|design|code|coding|automation|browser|app|software|device|api|gpu)\b|生成AI|画像|動画|アプリ|ソフト|プログラミング|人工知能/i,kind:'科技工具'},
{re:/\b(school|exam|learn|course|test|study|education|university)\b|受験|試験|学校|勉強|学習|高校|大学/i,kind:'教育学习'},
{re:/\b(travel|hotel|tourism|tourist|destination)\b|旅行|観光|宿泊|ホテル|温泉/i,kind:'旅行生活'}
];
const skip=/\b(murder|death|killed|shooting|shootout|war|bomb|terror|assault|celebrity|actor|actress|politician|president|election|earthquake|tsunami|wildfire|hurricane|lottery|football|basketball|baseball|nba|nfl|mlb)\b|殺人|死亡|地震|津波|選挙|大統領|首相|野球|サッカー|芸能|訃報|台風|事故|事件/i;

// Conservative, explainable opportunity scoring. This is NOT SEO difficulty or measured demand.
const reject=/\b(celebrity|actor|actress|died|death|obituary|murder|shooting|football|baseball|basketball|nba|nfl|mlb|match|score|stock|shares|earnings|election|president|politician|concert|movie|tv show|earthquake|war|attack|lottery)\b|俳優|女優|芸能|訃報|死亡|殺人|事件|野球|サッカー|株価|選挙|地震|戦争|ドラマ|映画|宝くじ/i;
const strong=/\b(converter|calculator|generator|template|planner|checker|validator|formatter|translator|transcriber|compress|merge pdf|invoice|tax calculator|unit conversion|resume builder|csv|pdf)\b|変換|計算|作成|テンプレート|料金比較|申請方法|確定申告|税金計算|履歴書|翻訳/i;
const medium=/\b(how to|guide|tutorial|compare|comparison|cost|price|schedule|map|route|visa|learning|study|ai tool|automation|workflow|budget|travel)\b|使い方|比較|方法|料金|勉強|学習|補助金|予約|観光|行き方/i;
function assess(query,kind){
 const excluded=reject.test(query),strongHit=strong.test(query),mediumHit=medium.test(query);
 const score=excluded?5:strongHit?85:mediumHit?65:kind!=='待人工判断'?45:20;
 const rank=score>=75?'high':score>=55?'medium':'low';
 const reason=excluded?'Mostly event, person, finance-news or sports intent':strongHit?'Explicit task or utility intent':mediumHit?'Possible actionable information need':kind!=='待人工判断'?'Topic match only; intent unclear':'No clear practical search intent';
 return {score,rank,reason,excluded};
}
const existing=new Map((old.items||[]).map(x=>[x.geo+':'+x.query.toLocaleLowerCase(),x]));
let success=0,newCount=0;
for(const geo of ['JP','US']){try{
const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);let res;try{res=await fetch('https://trends.google.com/trending/rss?geo='+geo,{headers:{'User-Agent':'Mozilla/5.0 (compatible; OpportunityRadar/1.0)','Accept':'application/rss+xml, application/xml, text/xml'},signal:controller.signal})}finally{clearTimeout(timeout)}
if(!res.ok)throw Error('HTTP '+res.status);
const xml=await res.text();const entries=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(x=>x[1]);if(!entries.length)throw Error('RSS contained no items');success++;
for(const row of entries){const query=get(row,'title').slice(0,180),traffic=get(row,'ht:approx_traffic'),pub=get(row,'pubDate'),key=geo+':'+query.toLocaleLowerCase();if(!query)continue;
const oldItem=existing.get(key),match=categories.find(x=>x.re.test(query));const kind=match?.kind||'待人工判断',potential=!!match&&!skip.test(query);
const suggestion=kind==='实用工具'?'调查是否需要计算器、转换器、表单或查询工具':kind==='科技工具'?'调查教程、功能对比或效率工具需求':kind==='教育学习'?'调查练习题、模拟测试、学习计划需求':kind==='旅行生活'?'调查路线、费用、行程或指南需求':'先确认实际搜索意图和长期需求';
const date=Date.parse(pub);const assessment=assess(query,kind);
existing.set(key,{geo,query,approxTraffic:traffic||null,publishedAt:Number.isFinite(date)?new Date(date).toISOString():null,firstSeenAt:oldItem?.firstSeenAt||new Date().toISOString(),lastSeenAt:new Date().toISOString(),category:kind,potential:assessment.score>=55,suggestion,opportunityScore:assessment.score,opportunityRank:assessment.rank,opportunityReason:assessment.reason,excludedAsNews:assessment.excluded,source:'Google Trends Trending Now RSS',sourceUrl:'https://trends.google.com/trending?geo='+geo,exploreUrl:'https://trends.google.com/trends/explore?geo='+geo+'&q='+encodeURIComponent(query),status:'待验证：近期热点，不代表长期需求',increasePercent:null});if(!oldItem)newCount++;
}
}catch(e){console.error('Google Trends RSS failed:',geo,String(e))}}
if(!success){console.log('All regions unavailable; keeping existing snapshot');process.exitCode=1;process.exit()}
let all=[...existing.values()].map(x=>{const a=assess(x.query,x.category||'待人工判断');return {...x,potential:a.score>=55,opportunityScore:a.score,opportunityRank:a.rank,opportunityReason:a.reason,excludedAsNews:a.excluded}}).sort((a,b)=>(b.lastSeenAt||'').localeCompare(a.lastSeenAt||'')).slice(0,160);
writeFileSync(file,JSON.stringify({updatedAt:new Date().toISOString(),regions:['JP','US'],successfulRegions:success,items:all,explanation:'Google Trends RSS provides approximate traffic buckets, not percent growth. Potential labels are rule-based research hints; not confirmed website demand.'},null,2)+'\n');console.log('Saved',all.length,'trends; newly seen',newCount,'regions',success);
