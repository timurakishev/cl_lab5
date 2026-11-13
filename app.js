/* Lab 5. Static, accessible standalone worksheet matching a dark academic site.
 * Browser restrictions are deterrents only, not reliable evidence of misconduct.
 */
(() => {
  'use strict';
  const root = document.getElementById('cl5');
  if (!root) return;
  const CONFIG = window.CL5_CONFIG || {};
  const KEY = 'ling3306-cl-lab5-v5';
  const defs = [
    { key:'start', title:'Students and corpora', short:'Setup' },
    { key:'a_profile', title:'Sources and content', short:'Overview', min:80 },
    { key:'a_trial', title:'Analytical features', short:'Analysis', min:120 },
    { key:'b_profile', title:'Sources and content', short:'Overview', min:80 },
    { key:'b_trial', title:'Analytical features', short:'Analysis', min:120 },
    { key:'inventory', title:'Features and documentation', min:120 },
    { key:'comparison', title:'Evaluate the interfaces', short:'Evaluation', min:140 },
    { key:'review', title:'Review and submit', short:'Report' },
  ];
  const criteria = [
    { key:'presence', label:'Presence or absence', description:'Do the platforms offer the tools you needed?', options:['Not assessed','Most tools present','Some tools present','Few tools present','Not available'] },
    { key:'access', label:'Accessibility', description:'How easy is it to locate and use those tools?', options:['Not assessed','Easy to use','Some effort needed','Difficult to use'] },
    { key:'function', label:'Functionality', description:'Do the tools work properly and return useful results?', options:['Not assessed','Works well','Works with limits','Unreliable'] },
    { key:'usability', label:'Research usability', description:'Can you use the interface for meaningful research?', options:['Not assessed','Strong','Adequate','Limited'] },
  ];
  const supportFeatures = [
    {key:'docs',label:'Documentation',hint:'Guides, tutorials, examples',options:['Not tested','Clear','Basic','Hard to find','Not found']},
    {key:'sources',label:'Data sources',hint:'Origin and selection of texts',options:['Not tested','Detailed','Partial','Unclear','Not found']},
    {key:'nlp',label:'AI / NLP tools',hint:'Tagging, parsing, AI tools',options:['Not tested','Available','Limited','Not found']},
    {key:'repeat',label:'Reproducibility',hint:'Can others repeat a search?',options:['Not tested','Easy','With limits','Difficult']},
  ];
  const corpusName = side => (state[side==='a'?'aName':'bName']||`Corpus ${side.toUpperCase()}`).trim();
  const taskTitle = i => i===1?`${corpusName('a')}: sources and content`:i===2?`${corpusName('a')}: analytical features`:i===3?`${corpusName('b')}: sources and content`:i===4?`${corpusName('b')}: analytical features`:defs[i].title;
  const featureNames = [
    ['frequency','Frequency lists'], ['concordance','Concordances / KWIC'],
    ['keywords','Keyword lists / keyness'], ['collocations','Collocation analysis'],
    ['ngrams','N-gram analysis'], ['filters','Subcorpus / metadata filters']
  ];
  const initial = () => ({ version:5, step:0, name1:'', name2:'', aName:'', aUrl:'', bName:'', bUrl:'', answer:{}, source:{}, query:{}, screenshot:{}, features:{}, support:{}, criteria:{}, criteriaNotes:{}, decision:'', pastes:0, pasteLog:[], consent:false, submitted:false });
  const migrate = value => {
    if (!value || ![2,3,4,5].includes(value.version)) return null;
    const next = {...initial(), ...value, version:5};
    next.answer={...(value.answer||{})};
    next.support={...(value.support||{})};
    next.criteria={...(value.criteria||{})};
    next.criteriaNotes={...(value.criteriaNotes||{})};
    next.query={...(value.query||{})};
    next.screenshot={...(value.screenshot||{})};
    for(const k of ['a_trial','b_trial']) {
      if(next.query[k]&&!next.query[k+'_1'])next.query[k+'_1']=next.query[k];
      if(next.screenshot[k]&&!next.screenshot[k+'_1'])next.screenshot[k+'_1']=next.screenshot[k];
    }
    if (value.version===2) {
      next.step = [0,1,2,3,4,5,5,6,6,7][Math.max(0,Math.min(9,Number(value.step)||0))];
      const merge = (a,b,label) => [a||'',b ? `${label}\n${b}`:''].filter(Boolean).join('\n\n');
      next.answer.inventory=merge(value.answer?.inventory,value.answer?.support,'Documentation and other research support:');
      next.answer.comparison=merge(value.answer?.comparison,value.answer?.conclusion,'Conclusion:');
      if(value.source?.support&&!next.source.inventory)next.source.inventory=value.source.support;
      if(value.source?.conclusion&&!next.source.comparison)next.source.comparison=value.source.conclusion;
    }
    next.step=Math.max(0,Math.min(7,Number(next.step)||0));
    return next;
  };
  let state=initial();
  try {
    const saved = JSON.parse(localStorage.getItem('ling3306-cl-lab5-v5') || localStorage.getItem('ling3306-cl-lab5-v3') || localStorage.getItem('ling3306-cl-lab5-v2') || 'null');
    state = migrate(saved) || initial();
  } catch (_) { /* Ignore damaged drafts. */ }
  const MAX_IMAGES_PER_FIELD = 2;
  let busy = false;
  let lastPasteAt = 0;
  let toastTimer;
  let saveErrorShown=false;
  const $ = selector => document.querySelector(selector);
  const work = $('#cl5-work');
  const progress = $('#cl5-progress-rule');
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wordCount = s => String(s||'').trim().split(/\s+/u).filter(Boolean).length;
  const isHttp = v => {try {let x = new URL(v); return x.protocol==='http:' || x.protocol==='https:';}catch(_){return false;}};
  const count = key => wordCount(state.answer[key]);
  // Older drafts saved a single screenshot object; newer drafts save arrays.
  const screenshotsFor = key => {
    const entry = state.screenshot[key];
    return (Array.isArray(entry) ? entry : entry ? [entry] : []).filter(item => item?.data);
  };
  const pasteDeduction = () => Math.min(100, Math.max(0, Number(state.pastes)||0)*50);
  const remainingPoints = () => 100 - pasteDeduction();
  function autosave() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      saveErrorShown=false;
    } catch(_) {
      if(!saveErrorShown){toast('Your browser could not save the draft on this device.');saveErrorShown=true;}
    }
  }
  function toast(message) {
    const el = $('#cl5-toast');
    el.textContent = message; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.hidden=true, 5000);
  }
  function header(title, number, prompt, lead='') {
    return `<div class="cl5-section-number">Task ${number}</div>
      <h2>${safe(title)}</h2>${lead ? `<p class="cl5-reference">${lead}</p>`:''}<p class="cl5-question">${prompt}</p>`;
  }
  function input(key, label, placeholder='', options={}) {
    const val = safe(state[key] || '');
    return `<div class="cl5-field"><label for="cl5-${key}">${label}${options.required?' *':''}</label><input id="cl5-${key}" type="${options.type||'text'}" data-property="${key}" value="${val}" placeholder="${safe(placeholder)}" autocomplete="off" ${options.required?'required':''}></div>`;
  }
  function textarea(key,min,label='Your answer',placeholder='Describe what you found, with examples.') {
    return `<div class="cl5-field"><label for="cl5-answer">${safe(label)}</label>
      <textarea id="cl5-answer" class="cl5-writing" data-answer="${key}" spellcheck="true" placeholder="${safe(placeholder)}">${safe(state.answer[key] || '')}</textarea>
      <div class="cl5-count" data-short="${count(key)<min}"><span id="cl5-wc">${count(key)} words</span><span>Minimum: ${min} words</span></div>
      </div>`;
  }
  function screenshotsMarkup(key, requiredImage=false) {
    const data = screenshotsFor(key);
    return `<div class="cl5-upload"><input id="cl5-image-${safe(key)}" data-image="${safe(key)}" type="file" accept="image/png,image/jpeg,image/webp" multiple></div>
      <small>${requiredImage?'At least one screenshot is required. ':''}Attach up to ${MAX_IMAGES_PER_FIELD} screenshots here. PNG, JPG or WebP; images are included in the PDF report.</small>
      ${data.map((item,index) => `<div class="cl5-evidence-file"><img class="cl5-thumbnail" src="${item.data}" alt="Attached screenshot ${index+1}"><span>${safe(item.name)}</span><button class="cl5-link-danger" type="button" data-remove-image="${safe(key)}" data-remove-image-index="${index}">Remove</button></div>`).join('')}`;
  }
  function evidence(key, requiredImage=false, details='Link to the page or search result you used.') {
    return `<section class="cl5-evidence"><h3>Sources and screenshots</h3>
      <div class="cl5-field"><label for="cl5-source">${key==='inventory'?'Documentation / feature URL *':'Official corpus information URL *'}</label><input id="cl5-source" type="url" data-source="${key}" value="${safe(state.source[key] || '')}" placeholder="https://..." autocomplete="off"><small>${safe(details)}</small></div>
      <div class="cl5-field"><label for="cl5-image-${safe(key)}">${requiredImage?'Upload screenshots *':'Screenshots (optional)'}</label>
       ${screenshotsMarkup(key,requiredImage)}</div></section>`;
  }
  function queryField(key,index) {
    return `<div class="cl5-field"><label for="cl5-query-${index}">Analysis ${index} — query and settings *</label><input id="cl5-query-${index}" type="text" data-query="${key}_${index}" value="${safe(state.query[key+'_'+index]||'')}" placeholder="Search term, filters, settings…"><small>Record the exact query and settings.</small></div>`;
  }
  function screenshotField(key,index){
    const id=`${key}_${index}`;
    return `<div class="cl5-field"><label for="cl5-image-${safe(id)}">Analysis ${index} — screenshots *</label>
      ${screenshotsMarkup(id,true)}</div>`;
  }
  function setup() {
    return header('Students and corpora',1,
      "Enter both students' names and the two assigned corpora. Work together: both students should explore both platforms, discuss what they find, and then write their answers.") +
      `<div class="cl5-duo">${input('name1','Student 1 — full name','',{required:true})}${input('name2','Student 2 — full name','',{required:true})}</div><hr class="cl5-rule">`+
      `<div class="cl5-duo">${input('aName','Corpus A — name','',{required:true})}${input('aUrl','Corpus A — website','https://',{type:'url',required:true})}</div>`+
      `<div class="cl5-duo">${input('bName','Corpus B — name','',{required:true})}${input('bUrl','Corpus B — website','https://',{type:'url',required:true})}</div>`+
      `<p class="cl5-help">Read Table 1 of Akishev (2026) before starting.</p>`;
  }
  function profile(which) {
    const side=which.toLowerCase(),key=side+'_profile', name=corpusName(side);
    const prompt=`Read the official information about <strong>${safe(name)}</strong>. Who compiled it? Which languages, years and types of texts does it cover? Where did the texts come from? Give its size, if stated. Note any missing details.`;
    return header(`${name}: sources and content`,which==='A'?2:4,prompt)+
      (which==='A' ? `<div class="cl5-integrity"><strong>Writing rule.</strong> Type your written answers; do not paste text from websites or AI tools into answer fields. You may paste into names, corpus names, search queries and URL fields. Each blocked paste attempt in an answer field carries a <strong>50-point deduction</strong> (maximum 100). Your progress is saved on this device. Contact your instructor if you need an accessibility accommodation.</div>`:'')+
      textarea(key,80)+evidence(key,false,'Paste a link to an official About, Description or Documentation page explaining the corpus content and data sources.');
  }
  function trial(which) {
    const side=which.toLowerCase(),key=side+'_trial',name=corpusName(side);
    const prompt=`Explore all four analytical features discussed in Akishev (2026): frequency lists, concordances, keyword lists, and collocations. Test <strong>two</strong> of these features in <strong>${safe(name)}</strong>. Record the queries and settings, discuss what you found, and upload screenshots of both analyses. If a feature is unavailable, note that in Task 6.`;
    return header(`${name}: analytical features`,which==='A'?3:5,prompt)+
      `<div class="cl5-analysis-pair"><div class="cl5-analysis-item">${queryField(key,1)}${screenshotField(key,1)}</div><div class="cl5-analysis-item">${queryField(key,2)}${screenshotField(key,2)}</div></div>`+
      textarea(key,120,'What did the two analyses show?','Explain the results of each analysis, what the tools showed, and any problems you encountered.');
  }
  function optionsHTML(options,selected) {
    return options.map(v=>`<option value="${safe(v)}" ${selected===v?'selected':''}>${safe(v)}</option>`).join('');
  }
  function matrixRow(label,hint,kind,key,options) {
    const renderSelect = side => `<select aria-label="${safe(label)} — ${safe(corpusName(side))}" data-${kind}="${side}_${key}">${optionsHTML(options,(state[kind]||{})[side+'_'+key]||options[0])}</select>`;
    return `<div class="cl5-feature"><span><strong>${safe(label)}</strong>${hint?`<small>${safe(hint)}</small>`:''}</span>${renderSelect('a')}${renderSelect('b')}</div>`;
  }
  function featureInventory() {
    const tools=featureNames.map(([key,label])=>matrixRow(label,'','feature',key,['Not tested','Available','Limited','Not found','Access restricted'])).join('');
    const support=supportFeatures.map(x=>matrixRow(x.label,x.hint,'support',x.key,x.options)).join('');
    const columns=`<div class="cl5-feature-head"><span>What to check</span><span>${safe(corpusName('a'))}</span><span>${safe(corpusName('b'))}</span></div>`;
    return header('Features and documentation',6,
      `Explore all listed analytical features in both platforms. Check the documentation, data sources, AI/NLP tools and reproducibility. Select what you found and explain the main differences.`)+
      `<div class="cl5-matrix"><h3>Search and analytical features</h3>${columns}${tools}<p class="cl5-help">Explore all six features in both platforms. Record what is available and what is missing or restricted.</p>`+
      `<h3 class="cl5-matrix-divider">Research support</h3>${columns}${support}</div>`+
      `<div class="cl5-writing-prompt"><strong>What did you find?</strong><span>Comment on the documentation, corpus sources, AI/NLP features (if any), and whether you could reproduce your searches. Include specific examples.</span></div>`+
      textarea('inventory',120)+evidence('inventory',false,'Link to the documentation or a relevant feature page.');
  }
  function criterionBlock(c,index) {
    const left=state.criteria['a_'+c.key]||c.options[0], right=state.criteria['b_'+c.key]||c.options[0], notes=state.criteriaNotes[c.key]||'';
    return `<section class="cl5-criterion" aria-labelledby="cl5-criterion-${c.key}">
      <div class="cl5-criterion-top"><span class="cl5-criterion-index">0${index+1}</span><div><h3 id="cl5-criterion-${c.key}">${safe(c.label)}</h3><p>${safe(c.description)}</p></div></div>
      <div class="cl5-criterion-picks">
        <div class="cl5-field"><label for="cl5-rating-a-${c.key}">${safe(corpusName('a'))}</label><select id="cl5-rating-a-${c.key}" data-criterion="a_${c.key}">${optionsHTML(c.options,left)}</select></div>
        <div class="cl5-field"><label for="cl5-rating-b-${c.key}">${safe(corpusName('b'))}</label><select id="cl5-rating-b-${c.key}" data-criterion="b_${c.key}">${optionsHTML(c.options,right)}</select></div>
      </div>
      <div class="cl5-field"><label for="cl5-note-${c.key}">Evidence (25+ words)</label><textarea id="cl5-note-${c.key}" class="cl5-criterion-writing cl5-writing" data-criterion-note="${c.key}" rows="3" placeholder="Use an example from your tests.">${safe(notes)}</textarea><span class="cl5-mini-count" data-note-count="${c.key}">${wordCount(notes)} / 25 words</span></div>
    </section>`;
  }
  function comparison() {
    const decisionOptions=[['','Choose one'],['a',corpusName('a')],['b',corpusName('b')],['both','Depends on the research task']];
    return header('Evaluate the interfaces',7,
      'Use the four criteria from <strong>Akishev (2026, Table 1)</strong>. Make a selection for each corpus, then explain it using evidence from your searches. These are descriptions, not numerical ratings.')+
      `<div class="cl5-criteria">${criteria.map(criterionBlock).join('')}</div>`+
      `<section class="cl5-criterion cl5-verdict"><div class="cl5-criterion-top"><span class="cl5-criterion-index">05</span><div><h3>Which platform would you use?</h3><p>Make a final choice based on the four criteria above.</p></div></div>`+
      `<div class="cl5-field"><label for="cl5-decision">Your choice</label><select id="cl5-decision" data-decision>${decisionOptions.map(([value,label])=>`<option value="${safe(value)}" ${state.decision===value?'selected':''}>${safe(label)}</option>`).join('')}</select></div>`+
      `<div class="cl5-field"><label for="cl5-answer">Explain your choice</label><p class="cl5-question">Support your choice with evidence. Suggest one improvement for each platform and mention one limitation of your comparison.</p><textarea id="cl5-answer" class="cl5-writing" data-answer="comparison" spellcheck="true" placeholder="Compare the platforms and explain your decision.">${safe(state.answer.comparison||'')}</textarea><div class="cl5-count" data-short="${count('comparison')<140}"><span id="cl5-wc">${count('comparison')} words</span><span>Minimum: 140 words</span></div></div></section>`;
  }
  function validation() {
    const issues=[];
    for (const [k,label] of [['name1','Student 1'],['name2','Student 2'],['aName','First corpus name'],['bName','Second corpus name']])
      if (!String(state[k]||'').trim()) issues.push(`Enter ${label}.`);
    for (const [k,label] of [['aUrl','First corpus website'],['bUrl','Second corpus website']])
      if (!isHttp(state[k])) issues.push(`Enter a valid ${label}.`);
    for (const d of defs.filter(x=>x.min))
      if (count(d.key)<d.min) issues.push(`${d.key==='comparison'?'Final decision':d.key==='inventory'?'Features and documentation':d.key.startsWith('a_')?corpusName('a')+': '+d.short:corpusName('b')+': '+d.short}: ${count(d.key)} / ${d.min} words.`);
    for (const k of ['a_profile','b_profile','inventory'])
      if (!isHttp(state.source[k])) issues.push(`${k==='inventory'?'Features and documentation':k==='comparison'?'Evaluation':k.startsWith('a_')?corpusName('a'):corpusName('b')}: add a source link.`);
    for (const k of ['a_trial','b_trial']) {
      for(const i of [1,2]){
        if(!String(state.query[k+'_'+i]||'').trim())issues.push(`${k.startsWith('a_')?corpusName('a'):corpusName('b')}: add query ${i}.`);
        if(!screenshotsFor(k+'_'+i).length)issues.push(`${k.startsWith('a_')?corpusName('a'):corpusName('b')}: add screenshot ${i}.`);
      }
    }
    for (const pfx of ['a','b']) {
      for(const [key,label] of featureNames)
        if(!state.features[pfx+'_'+key] || state.features[pfx+'_'+key]==='Not tested')
          issues.push(`${corpusName(pfx)}: assess ${label.toLowerCase()}.`);
      for(const item of supportFeatures)if(!state.support[pfx+'_'+item.key] || state.support[pfx+'_'+item.key]==='Not tested')
        issues.push(`${corpusName(pfx)}: assess ${item.label.toLowerCase()}.`);
    }
    for (const c of criteria) {
      if(!state.criteria['a_'+c.key] || state.criteria['a_'+c.key]==='Not assessed' || !state.criteria['b_'+c.key] || state.criteria['b_'+c.key]==='Not assessed') issues.push(`${c.label}: assess both corpora.`);
      if(wordCount(state.criteriaNotes[c.key])<25)issues.push(`${c.label}: write at least 25 words of evidence.`);
    }
    if(!state.decision)issues.push('Choose a platform in the final decision.');
    return issues;
  }
  function review() {
    const issues = validation();
    const wordTotal=defs.filter(d=>d.min).reduce((n,d)=>n+count(d.key),0)+criteria.reduce((n,c)=>n+wordCount(state.criteriaNotes[c.key]),0);
    const rows=[['Students',`${state.name1||'—'} / ${state.name2||'—'}`],['Platforms',`${corpusName('a')} / ${corpusName('b')}`],['Written work',`${wordTotal} words`],['Evidence',`${Object.keys(state.screenshot).reduce((n,key)=>n+screenshotsFor(key).length,0)} screenshots · ${['a_profile','b_profile','inventory'].filter(k=>isHttp(state.source[k])).length} links`],['Paste deduction',`${pasteDeduction()} points (${state.pastes} recorded attempt${state.pastes===1?'':'s'})`]];
    const disabled = issues.length || !state.consent ? 'disabled' : '';
    return header('Review and submit',8,'Check your work and download the completed report.')+
      `<div class="cl5-aux-heading">Report summary</div><div class="cl5-report-overview">${rows.map(([a,b])=>`<div class="cl5-review-row"><strong>${safe(a)}</strong><span>${safe(b)}</span></div>`).join('')}</div>`+
      `<h3>${issues.length?'Before submitting':'Report ready'}</h3>${issues.length?`<p class="cl5-incomplete">${issues.length} item${issues.length===1?'':'s'} need attention:</p><ul class="cl5-missing-list">${issues.map(x=>`<li>${safe(x)}</li>`).join('')}</ul>`:`<p class="cl5-complete">All required fields are complete.</p>`}`+
      `<label class="cl5-consent"><input id="cl5-consent" type="checkbox" ${state.consent?'checked':''}><span>We wrote the answers ourselves and used our own screenshots. Sources are cited.</span></label>`+
      `<div class="cl5-final-buttons"><button type="button" class="cl5-btn cl5-btn-primary" id="cl5-download" ${disabled}>Download PDF report</button></div>`+
      `<p class="cl5-help">After downloading, email the PDF to <strong>${safe(CONFIG.instructorEmail||'t.akishev@kimep.kz')}</strong> for grading.</p>`;
  }
  function render() {
    const step=state.step;
    work.innerHTML=step===0?setup():step===1?profile('A'):step===2?trial('A'):step===3?profile('B'):step===4?trial('B'):step===5?featureInventory():step===6?comparison():review();
    $('#cl5-progress-label').textContent=`Task ${step+1} of ${defs.length} · ${taskTitle(step)}`;
    progress.setAttribute('aria-valuenow',String(step+1));
    $('#cl5-progress-bar').style.width=`${100*(step+1)/defs.length}%`;
    $('#cl5-back').disabled=step===0;
    $('#cl5-next').textContent=step===defs.length-1?'Back to start ↺':'Next →';
    autosave();
  }
  function go(next) { state.step=Math.min(defs.length-1,Math.max(0,next)); render(); root.scrollIntoView({behavior:'instant',block:'start'}); }
  $('#cl5-back').addEventListener('click',()=>go(state.step-1));
  $('#cl5-next').addEventListener('click',()=>{
    if(state.step===0){$('#cl5-start-confirm').showModal();return;}
    go(state.step===defs.length-1?0:state.step+1);
  });
  $('#cl5-confirm-cancel').addEventListener('click',()=>$('#cl5-start-confirm').close());
  $('#cl5-confirm-continue').addEventListener('click',()=>{$('#cl5-start-confirm').close();go(1);});
  $('#cl5-framework-open').addEventListener('click',()=>$('#cl5-dialog').showModal());
  $('#cl5-dialog-close').addEventListener('click',()=>$('#cl5-dialog').close());
  $('#cl5-dialog').addEventListener('click',e=>{if(e.target.id==='cl5-dialog')e.target.close();});
  function updateValue(el) {
    if(el.dataset.property)state[el.dataset.property]=el.value;
    else if(el.dataset.answer){ state.answer[el.dataset.answer]=el.value; const counter=$('#cl5-wc'); if(counter){counter.textContent=`${wordCount(el.value)} words`;counter.parentElement.dataset.short=String(wordCount(el.value)<defs[state.step].min);} }
    else if(el.dataset.source)state.source[el.dataset.source]=el.value.trim();
    else if(el.dataset.query)state.query[el.dataset.query]=el.value;
    else if(el.dataset.feature)state.features[el.dataset.feature]=el.value;
    else if(el.dataset.support)state.support[el.dataset.support]=el.value;
    else if(el.dataset.criterion)state.criteria[el.dataset.criterion]=el.value;
    else if(el.dataset.criterionNote){state.criteriaNotes[el.dataset.criterionNote]=el.value;const counter=work.querySelector(`[data-note-count="${el.dataset.criterionNote}"]`);if(counter)counter.textContent=`${wordCount(el.value)} / 25 words`;}
    else if(el.hasAttribute('data-decision'))state.decision=el.value;
    else if(el.id==='cl5-consent')state.consent=el.checked;
    autosave();
  }
  work.addEventListener('input',e=>{if(e.target.matches('input,textarea,select'))updateValue(e.target);});
  work.addEventListener('change',async e=>{
    if(e.target.dataset.image) await storeImages(e.target.dataset.image,Array.from(e.target.files||[]));
    else if(e.target.matches('input,textarea,select'))updateValue(e.target);
  });
  work.addEventListener('click',async e=>{
    const target=e.target.closest('button');if(!target)return;
    if(target.dataset.removeImage){
      const key=target.dataset.removeImage;
      const images=screenshotsFor(key);
      images.splice(Number(target.dataset.removeImageIndex||0),1);
      if(images.length)state.screenshot[key]=images;
      else delete state.screenshot[key];
      render();
    }
    else if(target.id==='cl5-download')await downloadPdf();
  });
  // Only written answer fields block pasting. Names, search queries, corpus
  // names and URLs permit pasting. Browser-side detection is a deterrent, not proof.
  function pasteWarning(event) {
    const field=event.target;
    if(!(field instanceof Element) || !field.matches('textarea.cl5-writing'))return;
    event.preventDefault();
    const now=Date.now(); if(now-lastPasteAt<700)return; lastPasteAt=now;
    state.pastes++; state.pasteLog.push(new Date().toISOString()); autosave();
    const penaltyEl = $('#cl5-penalty');
    if (penaltyEl) penaltyEl.textContent = `Deduction: −${pasteDeduction()} points.`;
    toast(`Paste blocked. −50 points. Remaining: ${remainingPoints()}/100. Attempt ${state.pastes} recorded.`);
  }
  work.addEventListener('paste',pasteWarning);
  work.addEventListener('drop',pasteWarning);
  work.addEventListener('beforeinput',e=>{if(e.inputType==='insertFromPaste' || e.inputType==='insertFromDrop')pasteWarning(e);});
  // Keep the task prompts and writing rule from being selected/copied casually.
  work.addEventListener('copy',e=>{
    const sel=window.getSelection();
    const rule=work.querySelector('.cl5-integrity');
    const coversRule=!!(rule && sel && sel.rangeCount && sel.getRangeAt(0).intersectsNode(rule));
    if(e.target.closest('.cl5-question, .cl5-integrity') || coversRule){
      e.preventDefault();
      toast('Please refer to the instructions on this page rather than copying them.');
    }
  });
  // Do not let visitors copy the static lab text with an ordinary browser copy command.
  // Keep students' own form entries selectable and copyable.
  document.addEventListener('copy', event => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('.cl5-page')) return;
    if (target.closest('input, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
  }, true);
  async function storeImages(key,files) {
    if(!files.length)return;
    const existing=screenshotsFor(key);
    const slots=MAX_IMAGES_PER_FIELD-existing.length;
    if(slots<=0){toast(`You can attach up to ${MAX_IMAGES_PER_FIELD} screenshots here. Remove one to replace it.`);return;}
    const added=[];
    for(const file of files.slice(0,slots)){
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('Choose a PNG, JPG, or WebP image.');continue;}
      if(file.size>8*1024*1024){toast('An image exceeds 8 MB. Crop or resize it and try again.');continue;}
      const objectUrl=URL.createObjectURL(file);
      try {
        const img=new Image();img.src=objectUrl;await img.decode();
        const scale=Math.min(1,1350/Math.max(img.width,img.height));
        const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        added.push({name:file.name.slice(0,90),data:canvas.toDataURL('image/jpeg',.76)});
      }catch(_){toast('Could not read a screenshot. Try a PNG or JPG.');}
      finally{URL.revokeObjectURL(objectUrl);}
    }
    if(!added.length)return;
    state.screenshot[key]=[...existing,...added];
    render();
    if(files.length>slots){toast(`Only ${MAX_IMAGES_PER_FIELD} screenshots can be attached to each field.`);}
    else{toast(`${added.length} screenshot${added.length===1?'':'s'} attached and saved locally.`);}
  }
  function reportName(){
    const shortName=(state.name1||'students').trim().replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,42)||'students';
    return `LING3306_Lab5_${shortName}.pdf`;
  }
  async function pdfBlob(){
    if(!window.CL5Pdf || typeof window.CL5Pdf.build!=='function')throw new Error('PDF generator did not load. Reload the page and try again.');
    return window.CL5Pdf.build(state,{corpusA:corpusName('a'),corpusB:corpusName('b'),features:featureNames,support:supportFeatures,criteria,filename:reportName()});
  }
  function readyToFinish() {
    const issues=validation();
    if(issues.length){toast('Complete the missing required fields first.');return false;}
    if(!state.consent){toast('Confirm the declaration first.');return false;}
    return true;
  }
  async function downloadPdf(){
    if(!readyToFinish() || busy)return;
    busy=true;
    const button=$('#cl5-download');
    if(button){button.disabled=true;button.textContent='Preparing PDF…';}
    try{
      const blob=await pdfBlob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url;link.download=reportName();
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      toast(`PDF downloaded. Email it to ${CONFIG.instructorEmail||'t.akishev@kimep.kz'} for grading.`);
    }catch(e){
      toast(`Could not create PDF: ${e.message}`);
    }finally{
      busy=false;
      if(button){button.disabled=false;button.textContent='Download PDF report';}
    }
  }
  render();
})();
