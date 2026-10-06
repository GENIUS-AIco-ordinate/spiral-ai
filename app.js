const $ = (id) => document.getElementById(id);
const state = {
  settings: JSON.parse(localStorage.getItem('spiral.settings') || '{}'),
  messages: JSON.parse(localStorage.getItem('spiral.messages') || '[]'),
  attachments: [],
  chats: JSON.parse(localStorage.getItem('spiral.chats') || '[]'),
  jobs: JSON.parse(localStorage.getItem('spiral.jobs') || '[]'),
  busy: false,
  speaking: false,
  media: []
};

const defaults = {
  theme:'dark', accent:'blue', web_enabled:true, background_enabled:true,
  speak_enabled:false, voice_speed:1, api_base:'', memory:'', smart_mode:true,
  server_online:false
};
state.settings = {...defaults, ...state.settings};

function applyTheme(){
  const theme = state.settings.theme || 'dark';
  const light = theme === 'light' || (theme === 'system' && matchMedia('(prefers-color-scheme: light)').matches);
  document.body.classList.toggle('light', light);
  const accents={blue:'#4f8cff',purple:'#8b6cff',green:'#31b87b',orange:'#f08b3d',red:'#e45b67',pink:'#e66aa7',cyan:'#35b9d5',yellow:'#c7a63b'};
  document.documentElement.style.setProperty('--accent', state.settings.accent_custom || accents[state.settings.accent] || accents.blue);
  document.documentElement.style.setProperty('--accent-soft', `color-mix(in srgb, var(--accent), transparent 84%)`);
}
function persist(){localStorage.setItem('spiral.settings',JSON.stringify(state.settings));localStorage.setItem('spiral.messages',JSON.stringify(state.messages.slice(-100)));localStorage.setItem('spiral.jobs',JSON.stringify(state.jobs.slice(-40)));localStorage.setItem('spiral.chats',JSON.stringify(state.chats.slice(-40)))}
function apiBase(){return (state.settings.api_base || '').replace(/\/$/,'')}
function setStatus(text,busy=false){$('statusText').textContent=text;$('statusDot').classList.toggle('busy',busy)}
function escapeHTML(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function formatText(s){
  let x=escapeHTML(s);
  x=x.replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>');
  x=x.replace(/`([^`]+)`/g,'<code>$1</code>');
  x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  x=x.replace(/\n/g,'<br>');
  return x;
}
function render(){
  const box=$('messages'); box.innerHTML='';
  $('welcome').style.display=state.messages.length?'none':'';
  state.messages.forEach((m,i)=>{
    const row=document.createElement('article');row.className='msg '+m.role;
    const bubble=document.createElement('div');bubble.className='bubble';
    bubble.innerHTML=formatText(m.content||'');
    if(m.media){
      const media=m.media.kind==='video'?document.createElement('video'):document.createElement('img');
      media.src=m.media.url; media.className='generated-media'; if(m.media.kind==='video')media.controls=true; bubble.appendChild(media);
    }
    if(m.sources?.length){const src=document.createElement('div');src.className='sources';src.innerHTML='<div class="sources-title">Sources</div>'+m.sources.map(s=>`<a target="_blank" rel="noopener" href="${escapeHTML(s.url)}">${escapeHTML(s.title||s.url)}</a>`).join('');bubble.appendChild(src)}
    row.appendChild(bubble);box.appendChild(row);
  });
  box.scrollTop=box.scrollHeight;
}
function addMessage(role,content,extra={}){state.messages.push({role,content,...extra});render();persist()}
function resize(){const el=$('input');el.style.height='auto';el.style.height=Math.min(el.scrollHeight,180)+'px'}
function promptFill(p){$('input').value=p;$('input').focus();resize()}

async function checkServer(){
  try{const r=await fetch(apiBase()+'/api/status',{cache:'no-store'});if(!r.ok)throw new Error();const v=await r.json();state.settings.server_online=true;setStatus('Ready');$('serverPill').textContent='Connected';$('serverPill').className='server-pill online';return v}catch(e){state.settings.server_online=false;setStatus('Local UI');$('serverPill').textContent='Backend not connected';$('serverPill').className='server-pill';return null}
}

function addAttachment(file){
  if(state.attachments.some(a=>a.name===file.name&&a.size===file.size)){return}
  if(state.attachments.reduce((n,a)=>n+a.size,0)+file.size>12*1024*1024){setStatus('Attachments limited to 12 MB');return}
  const reader=new FileReader();reader.onload=()=>{const data=String(reader.result||'');const image=file.type.startsWith('image/');const textLike=/\.(txt|md|csv|tsv|json|py|js|jsx|ts|tsx|html|css|xml|yaml|yml|log|java|c|cpp|h|sql|rtf)$/i.test(file.name);state.attachments.push({name:file.name,size:file.size,mime:file.type||'application/octet-stream',text:textLike?data:'',data_url:image?data:''});renderAttachments()};reader.readAsDataURL(file)
}
function renderAttachments(){const box=$('attachments');box.innerHTML='';state.attachments.forEach((a,i)=>{const el=document.createElement('button');el.className='attachment';el.innerHTML='📎 '+escapeHTML(a.name)+' <span>×</span>';el.onclick=()=>{state.attachments.splice(i,1);renderAttachments()};box.appendChild(el)})}

function routeHint(text){
  const t=text.toLowerCase();
  if(/\b(create|generate|make|draw|design|render)\b/.test(t)&&/\b(video|clip|animation|film|movie)\b/.test(t))return 'video';
  if(/\b(create|generate|make|draw|design|render)\b/.test(t)&&/\b(image|picture|illustration|poster|logo)\b/.test(t))return 'image';
  if(/\b(latest|today|current|news|weather|search|look up|browse|recent|this week|right now|yesterday)\b/.test(t))return 'web';
  if(/\b(debug|code|program|python|java|javascript|typescript|html|css|sql|react|bug|website|app|function|class|compile|error)\b/.test(t))return 'code';
  if(state.attachments.length)return 'file';
  return 'chat';
}

async function send(){
  const text=$('input').value.trim();if((!text&&!state.attachments.length)||state.busy)return;
  state.busy=true;$('sendBtn').disabled=true;const outgoing=text||'Please analyze the attached file(s).';const files=state.attachments.slice();const had=files.length;state.attachments=[];renderAttachments();$('input').value='';resize();addMessage('user',outgoing);$('typing').classList.remove('hidden');setStatus(had?'Reading your files':'Thinking',true);
  if(!state.settings.server_online){addMessage('assistant','SPIRAL is ready, but its AI backend is not connected yet. Open Settings → Connection and enter your SPIRAL backend URL. The interface, files, memory, history, themes, voice and background queue still work locally.');finish();return}
  try{
    const payload={messages:state.messages.slice(-30).map(m=>({role:m.role,content:m.content})),files_text:files.filter(f=>f.text).map(f=>`--- ${f.name} ---\n${f.text}`).join('\n\n'),images:files.filter(f=>f.data_url).map(f=>f.data_url),memory:(state.settings.memory||'').split('\n').filter(Boolean),web_enabled:state.settings.web_enabled};
    const r=await fetch(apiBase()+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());
    const reader=r.body.getReader(),decoder=new TextDecoder();let buffer='',answer='',meta={};
    while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const chunks=buffer.split('\n\n');buffer=chunks.pop();for(const chunk of chunks){const line=chunk.split('\n').find(x=>x.startsWith('data: '));if(!line)continue;let ev;try{ev=JSON.parse(line.slice(6))}catch{continue}if(ev.type==='status'){setStatus(ev.text||'Working',true)}else if(ev.type==='meta'){meta=ev}else if(ev.type==='delta'){answer+=ev.text||''}else if(ev.type==='media'){state.media.push(ev);addMessage('assistant','', {media:ev});}else if(ev.type==='error'){throw new Error(ev.message||'SPIRAL backend error')}else if(ev.type==='done'){}}}
    if(answer.trim())addMessage('assistant',answer,{sources:meta.sources||[]});
    if((state.speaking||state.settings.speak_enabled)&&answer.trim())speak(answer);setStatus(meta.route==='web'?'Web research complete':'Ready');
  }catch(e){addMessage('assistant','I hit a problem: '+e.message);setStatus('Ready')}
  finish();
}
function finish(){state.busy=false;$('sendBtn').disabled=false;$('typing').classList.add('hidden');persist();$('input').focus()}
function speak(text){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=Number(state.settings.voice_speed||1);speechSynthesis.speak(u)}
function mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setStatus('Voice input unavailable');return}const r=new SR();r.lang=navigator.language||'en-US';r.interimResults=false;r.onstart=()=>setStatus('Listening',true);r.onresult=e=>{promptFill(e.results[0][0].transcript)};r.onend=()=>setStatus('Ready');r.start()}

function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));const v=$(name+'View');if(v)v.classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='background')renderJobs();if(name==='library')renderLibrary();if(name==='saved')renderSaved();if(name==='memory')renderMemory();}
function renderJobs(){const box=$('jobsList');box.innerHTML='';if(!state.jobs.length){box.innerHTML='<div class="empty-card">No background jobs yet.<br><span>Use Background Work from the sidebar or ask SPIRAL to run a task in the background.</span></div>';return}state.jobs.slice().reverse().forEach(j=>{const el=document.createElement('div');el.className='job-card';el.innerHTML=`<div class="job-top"><strong>${escapeHTML(j.title)}</strong><span>${escapeHTML(j.status)}</span></div><div class="progress"><i style="width:${Math.min(100,j.progress||0)}%"></i></div><small>${escapeHTML(j.detail||'Background task')} · ${j.progress||0}%</small>`;box.appendChild(el)})}
function queueBackground(){const prompt=$('input').value.trim();if(!prompt){promptFill('Run this task in the background: ');return}const j={id:crypto.randomUUID(),title:prompt.slice(0,70),prompt,status:'queued',progress:0,detail:'Waiting for background worker'};state.jobs.push(j);persist();$('input').value='';resize();addMessage('assistant',`Background task queued.\nJob ID: ${j.id}\nOpen Background Work to follow progress.`);showView('background');if(state.settings.server_online){fetch(apiBase()+'/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:j.title,prompt:j.prompt})}).then(r=>r.json()).then(v=>{j.remote_id=v.id||j.id;j.status='running';j.detail='Worker started';persist();renderJobs()}).catch(()=>{j.status='local queue';j.detail='Backend unavailable for execution';persist();renderJobs()})}}
function renderLibrary(){const box=$('libraryContent');box.innerHTML=state.attachments.length?state.attachments.map(a=>`<div class="library-item">📎 ${escapeHTML(a.name)}<small>${Math.round(a.size/1024)} KB</small></div>`).join(''):'<div class="empty-card">Your uploaded and generated assets will appear here.</div>'}
function renderSaved(){const box=$('savedContent');const saved=JSON.parse(localStorage.getItem('spiral.saved')||'[]');box.innerHTML=saved.length?saved.map((x,i)=>`<div class="saved-item"><strong>${escapeHTML(x.title||'Saved answer')}</strong><p>${formatText(x.text)}</p><button onclick="deleteSaved(${i})">Remove</button></div>`).join(''):'<div class="empty-card">Save useful answers here from the message menu.</div>'}
window.deleteSaved=(i)=>{const a=JSON.parse(localStorage.getItem('spiral.saved')||'[]');a.splice(i,1);localStorage.setItem('spiral.saved',JSON.stringify(a));renderSaved()}
function renderMemory(){const box=$('memoryContent');box.innerHTML=`<div class="memory-card"><h3>Local memory</h3><p>These notes stay in this browser until you change or clear them.</p><textarea id="memoryQuick" placeholder="One memory per line">${escapeHTML(state.settings.memory||'')}</textarea><button class="primary-btn" id="saveMemoryQuick">Save memory</button></div>`;$('saveMemoryQuick').onclick=()=>{state.settings.memory=$('memoryQuick').value;persist();setStatus('Memory saved')}}
function openSettings(){loadSettingsForm();$('settingsDialog').showModal()}
function loadSettingsForm(){for(const [id,key] of Object.entries({apiBase:'api_base',accent:'accent',theme:'theme',memory:'memory',voiceSpeed:'voice_speed'})){if($(id))$(id).value=state.settings[key]??''}$('webEnabled').checked=state.settings.web_enabled!==false;$('backgroundEnabled').checked=state.settings.background_enabled!==false;$('speakEnabled').checked=state.settings.speak_enabled===true;$('smartMode').checked=state.settings.smart_mode!==false;$('customAccent').value=state.settings.accent_custom||''}
function saveSettings(){state.settings.api_base=$('apiBase').value.trim();state.settings.accent=$('accent').value;state.settings.accent_custom=$('customAccent').value.trim();state.settings.theme=$('theme').value;state.settings.memory=$('memory').value;state.settings.voice_speed=Number($('voiceSpeed').value||1);state.settings.web_enabled=$('webEnabled').checked;state.settings.background_enabled=$('backgroundEnabled').checked;state.settings.speak_enabled=$('speakEnabled').checked;state.settings.smart_mode=$('smartMode').checked;persist();applyTheme();$('settingsDialog').close();checkServer()}

function setupInstall(){let deferred=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('installBtn').hidden=false});$('installBtn').onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$('installBtn').hidden=true}else alert('On iPhone/iPad use Share → Add to Home Screen. On supported browsers, use Install SPIRAL AI from the browser menu.')}}
function startup(){applyTheme();render();renderAttachments();setupInstall();checkServer();setTimeout(()=>{$('splash').classList.add('hide')},2800);matchMedia('(prefers-color-scheme: light)').addEventListener('change',applyTheme)}

$('sendBtn').onclick=send;$('input').addEventListener('input',resize);$('input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});$('attachBtn').onclick=()=>$('fileInput').click();$('fileInput').onchange=e=>[...e.target.files].forEach(addAttachment);$('micBtn').onclick=mic;$('voiceToggle').onclick=()=>{state.speaking=!state.speaking;setStatus(state.speaking?'Voice on':'Ready')};$('settingsBtn').onclick=openSettings;$('saveSettings').onclick=e=>{e.preventDefault();saveSettings()};$('mobileMenu').onclick=()=>$('sidebar').classList.toggle('open');$('newChat').onclick=()=>{if(state.messages.length)state.chats.push({id:crypto.randomUUID(),title:state.messages.find(m=>m.role==='user')?.content?.slice(0,60)||'Chat',messages:state.messages});state.messages=[];persist();render();showView('chat');$('input').focus()};$('clearBtn').onclick=()=>$('newChat').click();$('themeBtn').onclick=()=>{state.settings.theme=state.settings.theme==='light'?'dark':'light';persist();applyTheme()};$('installBtn').hidden=true;$('backgroundShortcut').onclick=queueBackground;$('movieShortcut').onclick=()=>{promptFill('Create a movie about ');showView('chat')};
for(const b of document.querySelectorAll('.nav-btn'))b.onclick=()=>showView(b.dataset.view);for(const b of document.querySelectorAll('[data-prompt]'))b.onclick=()=>{promptFill(b.dataset.prompt);showView('chat')};$('fileShortcut').onclick=()=>$('fileInput').click();
$('searchChats').onclick=()=>{$('searchDialog').showModal();$('chatSearch').focus()};$('chatSearch').oninput=()=>{const q=$('chatSearch').value.toLowerCase();$('chatSearchResults').innerHTML=state.chats.filter(c=>(c.title||'').toLowerCase().includes(q)).slice(-20).reverse().map(c=>`<button class="search-result">${escapeHTML(c.title)}</button>`).join('')||'<span class="muted">No matching chats</span>'};
$('closeSearch').onclick=()=>$('searchDialog').close();$('searchDialog').addEventListener('click',e=>{if(e.target===$('searchDialog'))$('searchDialog').close()});

startup();
