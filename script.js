'use strict';
const $=id=>document.getElementById(id);
const board=$('crossword');
const wordById=new Map(WORDS.map(w=>[w.id,w]));
const occupied=new Map();
const inputs=new Map();
const solved=new Set();
let active=null;
let hitQueue=0;
let animating=false;
let completed=false;
const key=(r,c)=>`${r},${c}`;
const cellsOf=w=>Array.from({length:w.word.length},(_,i)=>key(w.r+(w.d==='V'?i:0),w.c+(w.d==='H'?i:0)));
const rows=Math.max(...WORDS.map(w=>w.r+(w.d==='V'?w.word.length:1)));
const cols=Math.max(...WORDS.map(w=>w.c+(w.d==='H'?w.word.length:1)));
board.style.setProperty('--rows',rows);
board.style.setProperty('--cols',cols);
function setCellSize(){const available=Math.min(680,Math.max(290,board.parentElement.clientWidth-28));board.style.setProperty('--cell',`${Math.max(20,Math.min(34,Math.floor((available-(cols-1)*3)/cols)))}px`)}
window.addEventListener('resize',setCellSize);
for(const w of WORDS)for(const pos of cellsOf(w)){if(!occupied.has(pos))occupied.set(pos,[]);occupied.get(pos).push(w.id)}
const starts=new Map();for(const w of WORDS){const p=key(w.r,w.c);if(!starts.has(p))starts.set(p,[]);starts.get(p).push(w.id)}
for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
 const pos=key(r,c),cell=document.createElement('div');cell.className='cell'+(occupied.has(pos)?'':' empty');cell.dataset.pos=pos;
 if(occupied.has(pos)){
  const numbers=starts.get(pos);if(numbers){const tag=document.createElement('span');tag.className='number';tag.textContent=numbers.join('/');cell.append(tag)}
  const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label',`Linha ${r+1}, coluna ${c+1}`);input.dataset.pos=pos;input.addEventListener('focus',()=>focusCell(pos));input.addEventListener('click',()=>focusCell(pos,true));input.addEventListener('input',()=>onInput(pos,input));input.addEventListener('keydown',e=>onKey(e,pos));cell.append(input);inputs.set(pos,input)
 }
 board.append(cell)
}
function clueButton(w){const b=document.createElement('button');b.className='clue-btn';b.type='button';b.dataset.word=w.id;b.innerHTML=`<span class="clue-num">${w.id.toString().padStart(2,'0')}</span><span class="clue-desc">${w.clue}</span><span class="clue-length">${w.word.length}</span>`;b.addEventListener('click',()=>selectWord(w.id,true));return b}
const horizontal=WORDS.filter(w=>w.d==='H'),vertical=WORDS.filter(w=>w.d==='V');horizontal.forEach(w=>$('horizontalClues').append(clueButton(w)));vertical.forEach(w=>$('verticalClues').append(clueButton(w)));$('hCount').textContent=horizontal.length;$('vCount').textContent=vertical.length;
function selectWord(id,focus=false){active=id;const w=wordById.get(id);$('selectedWord').textContent=`${w.id.toString().padStart(2,'0')} · ${w.d==='H'?'HORIZONTAL':'VERTICAL'} · ${w.word.length} LETRAS`;$('selectedClue').textContent=w.clue;document.querySelectorAll('.cell').forEach(el=>el.classList.remove('active','focused'));document.querySelectorAll('.clue-btn').forEach(el=>el.classList.toggle('selected',Number(el.dataset.word)===id));for(const p of cellsOf(w))inputs.get(p).parentElement.classList.add('active');if(focus){const first=cellsOf(w).find(p=>!inputs.get(p).value)||cellsOf(w)[0];inputs.get(first).focus()}}
function focusCell(pos,cycle=false){const ids=occupied.get(pos)||[];if(!ids.length)return;let id=ids.includes(active)?active:ids[0];if(cycle&&ids.length>1&&document.activeElement===inputs.get(pos)&&inputs.get(pos).dataset.wasActive==='1'){id=ids[(ids.indexOf(id)+1)%ids.length]}selectWord(id);for(const inp of inputs.values())inp.dataset.wasActive='0';inputs.get(pos).dataset.wasActive='1';inputs.get(pos).parentElement.classList.add('focused')}
function onInput(pos,input){input.value=input.value.toUpperCase().replace(/[^A-Z]/g,'').slice(-1);if(!active)focusCell(pos);clearFeedback();if(input.value){const arr=cellsOf(wordById.get(active)),idx=arr.indexOf(pos);if(idx>=0&&idx<arr.length-1)inputs.get(arr[idx+1]).focus()}}
function onKey(e,pos){if(e.key==='Enter'){e.preventDefault();check();return}if(e.key==='Backspace'&&!inputs.get(pos).value&&active){const arr=cellsOf(wordById.get(active)),idx=arr.indexOf(pos);if(idx>0){e.preventDefault();const prev=inputs.get(arr[idx-1]);prev.value='';prev.focus()}}if(e.key==='ArrowRight'||e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const [r,c]=pos.split(',').map(Number),delta={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowUp:[-1,0],ArrowDown:[1,0]}[e.key];const next=inputs.get(key(r+delta[0],c+delta[1]));if(next)next.focus()}if(e.key==='Tab'&&active){/* keep native tab accessibility */}}
function clearFeedback(){document.querySelectorAll('.cell.incorrect').forEach(el=>el.classList.remove('incorrect'))}
function check(){if(completed)return;let newHits=0,wrong=0;for(const w of WORDS){const positions=cellsOf(w);const attempt=positions.map(p=>inputs.get(p).value||'').join('');if(attempt===w.word){if(!solved.has(w.id)){solved.add(w.id);newHits++}}else if(attempt.length===w.word.length){wrong++}}
 for(const [pos,input] of inputs){const ids=occupied.get(pos);const allSolved=ids.some(id=>solved.has(id));const anyWrong=ids.some(id=>{const w=wordById.get(id),str=cellsOf(w).map(p=>inputs.get(p).value||'').join('');return str.length===w.word.length&&str!==w.word});input.parentElement.classList.toggle('correct',allSolved);input.parentElement.classList.toggle('incorrect',!allSolved&&anyWrong)}
 document.querySelectorAll('.clue-btn').forEach(b=>b.classList.toggle('solved',solved.has(Number(b.dataset.word))));$('score').textContent=String(solved.size).padStart(2,'0');$('progressFill').style.width=`${solved.size/WORDS.length*100}%`;$('enemyHealth').style.width=`${100-solved.size/WORDS.length*100}%`;
 if(newHits){$('feedback').textContent=`⚡ ${newHits} ${newHits===1?'novo acerto':'novos acertos'}! ${newHits===1?'Um golpe':'Uma sequência de golpes'} no adversário!`;$('combatMessage').textContent=`${solved.size} / ${WORDS.length} GOLPES CONECTADOS`;hitQueue+=newHits;animateHits()}else{$('feedback').textContent=wrong?`⚠ ${wrong} ${wrong===1?'palavra precisa':'palavras precisam'} de revisão. Confira as casas em rosa.`:'Continue preenchendo as palavras para atacar!'}
 if(solved.size===WORDS.length){completed=true;$('feedback').textContent='🏆 TODAS AS PALAVRAS RESOLVIDAS! K.O.!';$('combatMessage').textContent='PERFECT K.O. — VOCÊ VENCEU!';}
}
function animateHits(){if(animating)return;animating=true;const step=()=>{if(!hitQueue){animating=false;if(completed)setTimeout(()=>{$('enemy').classList.add('defeated');setTimeout(()=>$('koOverlay').hidden=false,800)},250);return}hitQueue--;const player=$('player'),enemy=$('enemy'),impact=$('impact');player.classList.remove('attack');enemy.classList.remove('hurt');impact.classList.remove('show');void player.offsetWidth;player.classList.add('attack');setTimeout(()=>{enemy.classList.add('hurt');impact.textContent=['HIT!','POW!','BAM!','CRIT!'][Math.floor(Math.random()*4)];impact.classList.add('show')},220);setTimeout(step,680)};step()}
function reset(){solved.clear();active=null;completed=false;hitQueue=0;animating=false;for(const input of inputs.values()){input.value='';input.parentElement.classList.remove('correct','incorrect','active','focused')}document.querySelectorAll('.clue-btn').forEach(b=>b.classList.remove('solved','selected'));$('score').textContent='00';$('progressFill').style.width='0%';$('enemyHealth').style.width='100%';$('playerHealth').style.width='100%';$('enemy').classList.remove('hurt','defeated');$('player').classList.remove('attack');$('impact').classList.remove('show');$('koOverlay').hidden=true;$('selectedWord').textContent='CLIQUE EM UMA PISTA';$('selectedClue').textContent='Use as pistas para descobrir os termos e acertar o adversário.';$('feedback').textContent='Novo combate iniciado. Boa sorte!';$('combatMessage').textContent='RESOLVA AS PALAVRAS PARA ATACAR!';selectWord(WORDS[0].id)}
$('checkBtn').addEventListener('click',check);$('resetBtn').addEventListener('click',reset);$('playAgain').addEventListener('click',reset);setCellSize();selectWord(WORDS[0].id);
