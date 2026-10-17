(()=>{'use strict';
const db=window.supabase.createClient('https://rtxtwbizfbsjhvttyatn.supabase.co','sb_publishable_sVjVP83s_N1i4WvMt1If5g_ZfuP1v1c');
const el=id=>document.getElementById(id),format=x=>Number(x||0).toLocaleString('fr-FR');
let user=null,active=false,current=null,clicks=0,remaining=0,timer=null,refreshing=false,starting=false,authBusy=false;
const note=(msg,error=false)=>{el('notice').textContent=msg;el('notice').style.color=error?'#ffadb7':'#a3e4bb'};
const unwrap=r=>{if(r.error)throw r.error;return r.data};
function halt(){active=false;clearTimeout(timer);timer=null;el('start').disabled=false;el('stop').disabled=true;el('rate').disabled=false;el('limit').disabled=false;el('status').textContent='Arrêté'}
async function refresh(){
if(!user||refreshing)return;
refreshing=true;
try{
const rows=unwrap(await db.from('acb_sessions').select('id,clicks,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(500));
const worldRow=unwrap(await db.from('button_world').select('total').eq('id',1).single());
const ownRow=unwrap(await db.from('button_players').select('total').eq('user_id',user.id).maybeSingle());
el('mine').textContent=format(ownRow?.total||0);
el('world').textContent=format(worldRow.total);el('total').textContent=format(rows.length);
const list=el('sessions');list.replaceChildren();
if(!rows.length)list.textContent='Aucune session de test.';
for(const r of rows){
const line=document.createElement('div'),details=document.createElement('div'),button=document.createElement('button');
details.textContent=format(r.clicks)+' clics';const date=document.createElement('small');
date.textContent=new Date(r.created_at).toLocaleString('fr-FR');details.append(date);
button.textContent='Annuler';button.className='danger';button.disabled=active;
button.onclick=async()=>{if(!confirm('Supprimer cette session de test ?'))return;try{unwrap(await db.rpc('acb_remove',{p_id:r.id}));await refresh();note('Session annulée.')}catch(e){note(e.message,true)}};
line.append(details,button);list.append(line);
}
}finally{refreshing=false}
}
async function auth(){
if(authBusy)return;
authBusy=true;
try{
const r=unwrap(await db.auth.getUser());
const next=r.user;
const changed=(user?.id||null)!==(next?.id||null);
if(changed)halt();
user=next;
el('loginPanel').hidden=!!user;el('app').hidden=!user;
if(user){el('account').textContent=user.email||user.id;if(changed){try{await refresh()}catch(e){note('Impossible de lire les compteurs : '+e.message,true)}}}
}finally{authBusy=false}
}
async function login(signup){try{
const args={email:el('email').value.trim(),password:el('password').value};
unwrap(await (signup?db.auth.signUp(args):db.auth.signInWithPassword(args)));
await auth();note(signup?'Compte créé. Une validation e-mail peut être nécessaire.':'Connecté.');
}catch(e){note(e.message,true)}}
el('login').onclick=()=>login(false);el('register').onclick=()=>login(true);
el('logout').onclick=async()=>{halt();await db.auth.signOut();await auth();note('Déconnecté.')};
el('rate').oninput=()=>{el('rateValue').textContent=el('rate').value};
async function sendBatch(){
if(!active)return;
const amount=remaining>0?Math.min(Number(el('rate').value),remaining):Number(el('rate').value);
try{
const total=unwrap(await db.rpc('acb_add',{p_id:current,p_clicks:amount}));
clicks=Number(total);el('clicks').textContent=format(clicks);
if(remaining>0){remaining-=amount;if(remaining<=0){halt();note('Limite atteinte.');await refresh();return}}
if(clicks%500<amount)refresh().catch(e=>note(e.message,true));
timer=setTimeout(sendBatch,1000);
}catch(e){halt();note('Test arrêté : '+e.message,true);await refresh().catch(()=>{})}}
el('start').onclick=async()=>{
if(active||starting||!user)return;
starting=true;el('start').disabled=true;
const limit=Number(el('limit').value);
if(!Number.isSafeInteger(limit)||limit<0||limit>1000000){starting=false;el('start').disabled=false;note('Limite entre 0 et 1 000 000.',true);return}
try{
const row=unwrap(await db.from('acb_sessions').insert({user_id:user.id}).select('id').single());
current=row.id;clicks=0;remaining=limit;el('clicks').textContent='0';active=true;
el('start').disabled=true;el('stop').disabled=false;el('rate').disabled=true;el('limit').disabled=true;el('status').textContent='Actif';
note('Test démarré.');refresh().catch(e=>note(e.message,true));timer=setTimeout(sendBatch,1000);
}catch(e){halt();note(e.message,true)}finally{starting=false}};
el('stop').onclick=async()=>{halt();await refresh().catch(()=>{});note('Test arrêté.')};
el('clear').onclick=async()=>{if(active||starting){note('Arrête d’abord le test.',true);return}
if(!confirm('Supprimer toutes tes sessions de test ?'))return;
try{unwrap(await db.rpc('acb_remove',{p_id:null}));await refresh();note('Tests supprimés.')}catch(e){note(e.message,true)}};
db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_DELETED')setTimeout(()=>auth().catch(e=>note(e.message,true)),0)});
auth().catch(e=>note(e.message,true));
})();