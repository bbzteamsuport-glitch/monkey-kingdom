/* Monkey Kingdom — static, GitHub Pages-compatible website. */
(() => {
  'use strict';
  const cfg = window.MONKEY_CONFIG || {};
  const serverId = /^\d{15,22}$/.test(String(cfg.discordServerId || '')) ? String(cfg.discordServerId) : '1286370837074804799';
  const admins = Array.isArray(cfg.admins) ? cfg.admins : [];
  const db = cfg.supabase || {};
  const sharedPoll = Boolean(/^https:\/\/[-\w]+\.supabase\.co\/?$/.test(String(db.url || '')) && db.anonKey && db.pollId);
  const pollId = String(db.pollId || 'season-1');
  const storageKey = `monkey-kingdom:vote:${pollId}`;
  const visitorKey = 'monkey-kingdom:visitor';
  const $ = (id) => document.getElementById(id);
  const games = [
    { id:'cs2', name:'Counter-Strike 2', kind:'Tactical FPS', icon:'🎯', glow:'#edb96b' },
    { id:'hoi4', name:'Hearts of Iron IV', kind:'Стратегия', icon:'🪖', glow:'#91bb91' },
    { id:'rocket', name:'Rocket League', kind:'Спорт / гонки', icon:'🚀', glow:'#648fef' },
    { id:'minecraft', name:'Minecraft', kind:'Песочница', icon:'⛏️', glow:'#8abd63' },
    { id:'fortnite', name:'Fortnite', kind:'Battle Royale', icon:'🪂', glow:'#c087ec' },
    { id:'valorant', name:'VALORANT', kind:'Tactical FPS', icon:'⚡', glow:'#ee767e' },
    { id:'gta', name:'GTA Online', kind:'Открытый мир', icon:'🚗', glow:'#ebb85f' },
    { id:'roblox', name:'Roblox', kind:'Платформа', icon:'🧱', glow:'#e87777' },
    { id:'phasmophobia', name:'Phasmophobia', kind:'Хоррор / кооператив', icon:'👻', glow:'#82b2ec' },
    { id:'repo', name:'R.E.P.O.', kind:'Хоррор / кооператив', icon:'🤖', glow:'#a6df82' },
    { id:'lethal', name:'Lethal Company', kind:'Кооператив', icon:'☢️', glow:'#deb572' },
    { id:'pubg', name:'PUBG', kind:'Battle Royale', icon:'🪖', glow:'#e1b162' }
  ];

  let latestMembers = [];
  let discordReady = false;
  let selectedGame = null;
  let ownVote = safeStorageGet(storageKey) || null;
  let showResults = Boolean(ownVote);
  let totals = Object.fromEntries(games.map(g=>[g.id,0]));
  let loadingVote = false;

  function safeStorageGet(key) { try {return localStorage.getItem(key)} catch {return null} }
  function safeStorageSet(key,val) { try {localStorage.setItem(key,val)} catch {} }
  function makeEl(tag, className, text) {
    const e=document.createElement(tag); if(className)e.className=className; if(text!==undefined)e.textContent=String(text); return e;
  }
  const normalize = s => String(s||'').trim().toLocaleLowerCase();
  const safeAvatar = s => typeof s==='string' && /^https:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\//.test(s) ? s : null;

  function setJoinLinks(url){
    if (!url || !/^https:\/\//i.test(url)) return;
    for(const id of ['header-join','online-join','footer-join']){
      const el=$(id); if(!el)continue; el.href=url; el.target='_blank'; el.rel='noopener noreferrer';
    }
  }
  if(cfg.discordInvite) setJoinLinks(cfg.discordInvite);

  function statusCaption(status){
    switch(status){case 'online':return 'В сети';case 'idle':return 'Отошёл';case 'dnd':return 'Не беспокоить';default:return 'В сети';}
  }
  function addAvatar(parent, member, fallback='🐵'){
    const avatar=safeAvatar(member?.avatar_url);
    if(avatar){const img=makeEl('img');img.src=avatar;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';parent.append(img)}
    else parent.append(makeEl('span','member-avatar',fallback));
  }
  function renderMembers(){
    const target=$('members-list');target.replaceChildren();
    if(!discordReady){target.append(makeEl('p','muted-message','Список недоступен. Проверь, включён ли Discord Server Widget.'));return;}
    if(!latestMembers.length){target.append(makeEl('p','muted-message','В публичном списке никого не видно.'));return;}
    latestMembers.slice(0,24).forEach(member=>{
      const item=makeEl('div','member');item.title=member.username||'Участник';
      addAvatar(item,member,'🐵');item.append(makeEl('span','member-name',member.username||'Участник'));target.append(item);
    });
  }
  function renderAdmins(){
    const box=$('admin-grid');box.replaceChildren();
    const placeholders=[
      {role:'КОРОЛЬ ДЖУНГЛЕЙ',emoji:'👑'},
      {role:'КОРОЛЕВСКИЙ СОВЕТНИК',emoji:'🍌'},
      {role:'СТРАЖ ПОРЯДКА',emoji:'🛡️'}
    ];
    const source=admins.length ? admins : placeholders;
    source.forEach(a=>{
      const item=makeEl('div','admin-card'),top=makeEl('div','admin-top'),avatar=makeEl('div','admin-avatar');
      const username=String(a.username||'');
      const member=latestMembers.find(m=>normalize(m.username)===normalize(username) || (Array.isArray(a.aliases)&&a.aliases.some(x=>normalize(x)===normalize(m.username))));
      if(member && safeAvatar(member.avatar_url))addAvatar(avatar,member,a.emoji||'🐵');
      else avatar.textContent=a.emoji||'🐵';
      const info=makeEl('div'),role=makeEl('div','admin-role',a.role||'Администрация');
      const name=makeEl('div','admin-name',username||'Скоро здесь');
      info.append(role,name);top.append(avatar,info);item.append(top,makeEl('div','admin-line'));
      const presence=makeEl('div','admin-presence');
      if(!username){presence.textContent='Состав команды обновляется';}
      else if(member){presence.textContent=statusCaption(member.status);presence.classList.add(['online','idle','dnd'].includes(member.status)?member.status:'online')}
      else presence.textContent=discordReady?'Нет в публичном списке':'Статус недоступен';
      item.append(presence);box.append(item);
    });
    $('admin-note').textContent=admins.length
      ? 'Если администратора нет в виджете, это не обязательно значит, что он офлайн: Discord показывает не всех участников (максимум 100).'
      : 'Здесь появятся участники команды королевства и их доступные статусы.';
  }

  async function fetchDiscord(){
    const refresh=$('refresh-online');refresh.disabled=true;refresh.textContent='Обновляем...';
    const controller=new AbortController();const abort=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(`https://discord.com/api/guilds/${serverId}/widget.json`,{mode:'cors',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      if(!Number.isFinite(data.presence_count)) throw new Error('Discord не вернул presence_count');
      latestMembers=Array.isArray(data.members)?data.members:[];
      discordReady=true;
      $('online-count').textContent=String(data.presence_count);
      $('hero-online').textContent=String(data.presence_count);
      $('visible-caption').textContent=`Показано ${Math.min(latestMembers.length,24)} из ${latestMembers.length} в публичном списке`;
      $('last-updated').textContent='Обновлено в '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})+' · автообновление раз в 60 сек.';
      $('live-label').textContent='ДАННЫЕ DISCORD';
      $('live-indicator').className='live-badge is-live';
      if(data.instant_invite)setJoinLinks(data.instant_invite);
    }catch(err){
      discordReady=false;latestMembers=[];
      $('online-count').textContent='—';$('hero-online').textContent='—';
      $('visible-caption').textContent='Данные недоступны';
      $('last-updated').textContent='Официальный виджет доступен по ссылке внизу страницы';
      $('live-label').textContent='НЕТ ДАННЫХ';$('live-indicator').className='live-badge is-error';
      console.warn('Discord Widget API:',err.message);
    }finally{
      clearTimeout(abort);refresh.disabled=false;refresh.textContent='Обновить ↻';
      renderMembers();renderAdmins();
    }
  }

  function getVisitorId(){
    let id=safeStorageGet(visitorKey);
    if(!id || !/^[a-f0-9-]{36}$/i.test(id)){
      id=(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')?crypto.randomUUID():'00000000-0000-4000-8000-'+Math.floor(Math.random()*281474976710655).toString(16).padStart(12,'0');
      safeStorageSet(visitorKey,id);
    }
    return id;
  }
  async function rpc(fn,payload){
    const base=String(db.url).replace(/\/$/,'');
    const key=String(db.anonKey).trim();
    const headers={'Content-Type':'application/json','apikey':key};
    if(key.startsWith('eyJ'))headers['Authorization']='Bearer '+key;
    const controller=new AbortController();const abort=setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch(`${base}/rest/v1/rpc/${fn}`,{method:'POST',headers,body:JSON.stringify(payload),signal:controller.signal});
      const body=await r.text();
      if(!r.ok)throw new Error((()=>{try{return JSON.parse(body).message||'Ошибка'}catch{return body.slice(0,100)}})());
      return body?JSON.parse(body):null;
    }finally{clearTimeout(abort)}
  }
  function totalVotes(){return Object.values(totals).reduce((a,b)=>a+b,0)}
  function paintCounters(){const amount=totalVotes();$('hero-votes').textContent=String(amount);$('poll-vote-number').textContent=`${amount} ГОЛОСОВ`}
  function setPollMessage(msg,isError=false){const el=$('poll-message');el.textContent=msg;el.classList.toggle('is-error',isError)}
  async function loadVoteTotals(){
    try{
      if(sharedPoll){
        const rows=await rpc('get_monkey_vote_totals',{p_poll_id:pollId});
        totals=Object.fromEntries(games.map(g=>[g.id,0]));
        if(Array.isArray(rows))rows.forEach(row=>{if(Object.hasOwn(totals,row.game_key))totals[row.game_key]=Number(row.votes)||0});
        $('poll-mode-text').textContent='ОБЩИЕ РЕЗУЛЬТАТЫ · SUPABASE';
      }else{
        totals=Object.fromEntries(games.map(g=>[g.id,g.id===ownVote?1:0]));
        $('poll-mode-text').textContent='ДЕМО · ГОЛОС ХРАНИТСЯ ТОЛЬКО У ТЕБЯ';
      }
      paintCounters();paintGameCards();
    }catch(err){
      $('poll-mode-text').textContent='РЕЗУЛЬТАТЫ ВРЕМЕННО НЕДОСТУПНЫ';
      setPollMessage('Не удалось получить голоса: '+err.message,true);
      console.warn('Poll results:',err);
    }
  }
  function buildGames(){
    const target=$('game-grid');target.replaceChildren();
    games.forEach(g=>{
      const card=makeEl('button','game-card');card.type='button';card.dataset.game=g.id;card.style.setProperty('--game-glow',g.glow);
      card.setAttribute('aria-pressed','false');card.setAttribute('aria-label','Выбрать '+g.name);
      const top=makeEl('div','game-top'),icon=makeEl('span','game-icon',g.icon),check=makeEl('span','game-check','✓');
      check.setAttribute('aria-hidden','true');top.append(icon,check);
      const bottom=makeEl('div','game-bottom');bottom.append(makeEl('span','game-kind',g.kind),makeEl('span','game-name',g.name));
      const result=makeEl('div','game-result'),line=makeEl('div','result-row');
      line.append(makeEl('span','result-votes','0 голосов'),makeEl('strong','result-percent','0%'));
      const track=makeEl('div','result-track'),fill=makeEl('div','result-fill');track.append(fill);result.append(line,track);bottom.append(result);
      card.append(top,bottom);
      card.addEventListener('click',()=>{
        if(ownVote || loadingVote)return;
        selectedGame=g.id;paintGameCards();
      });
      target.append(card);
    });
    $('hero-games').textContent=String(games.length);
  }
  function paintGameCards(){
    $('game-grid').classList.toggle('showing-results',showResults);
    for(const card of document.querySelectorAll('.game-card')){
      const id=card.dataset.game;
      card.classList.toggle('is-selected',id===selectedGame);
      card.classList.toggle('is-voted',id===ownVote);
      card.setAttribute('aria-pressed',String(id===selectedGame));
      const qty=totals[id]||0;const percent=totalVotes()?Math.round(qty*100/totalVotes()):0;
      card.querySelector('.result-votes').textContent=`${qty} ${qty===1?'голос':qty%10>=2&&qty%10<=4&&(qty%100<12||qty%100>14)?'голоса':'голосов'}`;
      card.querySelector('.result-percent').textContent=percent+'%';
      card.querySelector('.result-fill').style.width=percent+'%';
    }
    const voteBtn=$('submit-vote');voteBtn.disabled=Boolean(ownVote)||!selectedGame||loadingVote;
    voteBtn.textContent=loadingVote?'Отправляем...':ownVote?'Голос учтён ✓':'Голосовать →';
    $('vote-hint').textContent=ownVote?'Твой выбор сделан, ваше величество!':'Одна обезьяна — один голос.';
    $('vote-description').textContent=ownVote
      ? `Ты выбрал: ${games.find(g=>g.id===ownVote)?.name||ownVote}.`
      : 'Выбери одну игру выше и нажми кнопку.';
    $('show-results').textContent=showResults?'Скрыть результаты ↑':'Результаты ↗';
  }
  async function castVote(){
    if(!selectedGame || ownVote || loadingVote)return;
    loadingVote=true;paintGameCards();setPollMessage('');
    try{
      if(sharedPoll){
        const ok=await rpc('cast_monkey_vote',{p_poll_id:pollId,p_voter_id:getVisitorId(),p_game_key:selectedGame});
        if(ok!==true)throw new Error('Этот браузер уже голосовал в этом раунде.');
      }
      ownVote=selectedGame;safeStorageSet(storageKey,ownVote);showResults=true;
      celebrateVote();
      setPollMessage(sharedPoll?'Голос принят и добавлен в общие результаты! 🍌':'Голос сохранён в твоём браузере. Для общего голосования подключи Supabase.');
      await loadVoteTotals();
    }catch(err){setPollMessage('Голос не отправлен: '+err.message,true)}
    finally{loadingVote=false;paintGameCards()}
  }
  function initNavigation(){
    const toggle=$('menu-toggle'),nav=$('site-navigation');
    toggle.addEventListener('click',()=>{const opened=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(opened));});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false')}));
  }
  function celebrateVote(){
    if(document.documentElement.classList.contains('motion-paused'))return;
    const burst=makeEl('div','vote-celebration');
    burst.setAttribute('aria-hidden','true');
    for(let i=0;i<18;i++){
      const piece=makeEl('span','confetti-piece',i%4===0?'🍌':'');
      const angle=(i/18)*Math.PI*2;
      piece.style.setProperty('--x',`${Math.cos(angle)*(100+i%3*45)}px`);
      piece.style.setProperty('--y',`${Math.sin(angle)*120-70}px`);
      piece.style.setProperty('--spin',`${i*47}deg`);
      piece.style.setProperty('--confetti-color',i%2?'#a985fc':'#ffdf59');
      burst.append(piece);
    }
    $('submit-vote').parentElement.append(burst);
    setTimeout(()=>burst.remove(),1400);
  }
  function initMotion(){
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const root=document.documentElement,button=$('motion-toggle'),hero=document.querySelector('.hero');
    const motionKey='monkey-kingdom:motion';
    let enabled=false,frame=0;
    const layers=Array.from(document.querySelectorAll('[data-parallax]'));
    const sections=Array.from(document.querySelectorAll('main > section[id]'));
    const links=Array.from(document.querySelectorAll('.site-nav a'));
    const renderScroll=()=>{
      frame=0;
      const scrollTop=Math.max(0,window.scrollY);
      const viewport=window.innerHeight;
      const range=Math.max(1,root.scrollHeight-viewport);
      // Read geometry before writing transforms; never intercept wheel or touch input.
      const bounds=layers.map(element=>element.getBoundingClientRect());
      const sectionBounds=sections.map(element=>element.getBoundingClientRect());
      const heroProgress=Math.min(1,scrollTop/Math.max(1,hero.offsetHeight));
      const previousShifts=layers.map(element=>parseFloat(element.style.getPropertyValue('--parallax-shift'))||0);
      root.style.setProperty('--scroll-progress',String(Math.min(1,scrollTop/range)));
      root.classList.toggle('is-scrolled',scrollTop>24);
      root.style.setProperty('--hero-shift',enabled?`${heroProgress*65}px`:'0px');
      root.style.setProperty('--title-shift',enabled?`${heroProgress*(window.innerWidth<601?8:34)}px`:'0px');
      layers.forEach((element,i)=>{
        const amount=Number(element.dataset.parallax)||0;
        const progress=Math.max(-1,Math.min(1,(viewport/2-(bounds[i].top-previousShifts[i]+bounds[i].height/2))/viewport));
        element.style.setProperty('--parallax-shift',enabled?`${progress*amount}px`:'0px');
      });
      let active='';
      sectionBounds.forEach((bounds,i)=>{if(bounds.top<=viewport*.4)active='#'+sections[i].id});
      links.forEach(link=>{if(link.getAttribute('href')===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
    };
    const scheduleScroll=()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(renderScroll)};
    const updateMotion=()=>{
      enabled=!reduced.matches&&safeStorageGet(motionKey)!=='off';
      root.classList.toggle('motion-paused',!enabled);
      button.setAttribute('aria-pressed',String(enabled));
      button.disabled=reduced.matches;
      button.title=reduced.matches?'Уменьшение движения включено в системе':enabled?'Приостановить анимации':'Включить анимации';
      button.replaceChildren(makeEl('span','',enabled?'Ⅱ':'▶'),document.createTextNode(reduced.matches?' Без движения':' Анимации'));
      button.firstElementChild.setAttribute('aria-hidden','true');
      if(!enabled)document.querySelectorAll('.reveal-pending').forEach(element=>element.classList.remove('reveal-pending'));
      scheduleScroll();
    };
    button.hidden=false;
    button.addEventListener('click',()=>{safeStorageSet(motionKey,enabled?'off':'on');updateMotion()});
    reduced.addEventListener('change',updateMotion);updateMotion();
    const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');observer.unobserve(entry.target)}});
    },{threshold:0.06,rootMargin:'0px 0px -24px 0px'}):null;
    if(observer&&enabled){
      document.querySelectorAll('.section-header,.about-lead,.about-poster,.about-copy,.stat-block,.online-main,.online-aside,.game-card,.admin-grid,.team-note,.discord-copy,.footer-wordmark,.footer-inner').forEach((element,i)=>{
        element.classList.add('motion-reveal');
        if(element.getBoundingClientRect().top>=window.innerHeight){
          element.classList.add('reveal-pending');element.style.setProperty('--reveal-delay',`${i%3*65}ms`);observer.observe(element);
        }
      });
    }
    window.addEventListener('scroll',scheduleScroll,{passive:true});
    window.addEventListener('resize',scheduleScroll,{passive:true});
    window.addEventListener('load',scheduleScroll,{once:true});
    const syncVisibility=()=>{root.classList.toggle('page-hidden',document.hidden);if(!document.hidden)scheduleScroll()};
    document.addEventListener('visibilitychange',syncVisibility);syncVisibility();
    if('ResizeObserver' in window)new ResizeObserver(scheduleScroll).observe(document.body);
    document.fonts?.ready.then(scheduleScroll);
  }
  function init(){
    initNavigation();buildGames();renderAdmins();paintGameCards();loadVoteTotals();fetchDiscord();
    initMotion();
    $('refresh-online').addEventListener('click',fetchDiscord);
    $('submit-vote').addEventListener('click',castVote);
    $('show-results').addEventListener('click',()=>{showResults=!showResults;paintGameCards();if(showResults&&sharedPoll)loadVoteTotals()});
    setInterval(()=>{if(!document.hidden)fetchDiscord()},60000);
    setInterval(()=>{if(!document.hidden&&sharedPoll&&showResults)loadVoteTotals()},30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)fetchDiscord()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
