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
    { key:'a_trial', title:'Try the search tools', short:'Searches', min:120 },
    { key:'b_profile', title:'Sources and content', short:'Overview', min:80 },
    { key:'b_trial', title:'Try the search tools', short:'Searches', min:120 },
    { key:'inventory', title:'Features and documentation', short:'Tools', min:120 },
    { key:'comparison', title:'Evaluate the interfaces', short:'Evaluation', min:140 },
    { key:'review', title:'Review and download', short:'Report' },
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
  const taskTitle = i => i===1?`${corpusName('a')} — sources and content`:i===2?`${corpusName('a')} — search tools`:i===3?`${corpusName('b')} — sources and content`:i===4?`${corpusName('b')} — search tools`:defs[i].title;
  const taskShort = i => (i>=1&&i<=4)?`${i<3?corpusName('a'):corpusName('b')} · ${i%2?'Overview':'Searches'}`:defs[i].short;
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
  let accessCode = '';
  let busy = false;
  let lastPasteAt = 0;
  let toastTimer;
  const $ = selector => document.querySelector(selector);
  const work = $('#cl5-work');
  const progress = $('#cl5-progress-rule');
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wordCount = s => String(s||'').trim().split(/\s+/u).filter(Boolean).length;
  const isHttp = v => {try {let x = new URL(v); return x.protocol==='http:' || x.protocol==='https:';}catch(_){return false;}};
  const count = key => wordCount(state.answer[key]);
  const pasteDeduction = () => Math.min(100, Math.max(0, Number(state.pastes)||0)*50);
  const remainingPoints = () => 100 - pasteDeduction();
  function autosave() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      $('#cl5-save-label').textContent = 'Draft saved on this device';
    } catch(_) {
      $('#cl5-save-label').textContent = 'Local storage unavailable — export a backup';
      toast('Draft could not be saved locally. Export a backup.');
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
  function textarea(key,min) {
    return `<div class="cl5-field"><label for="cl5-answer">Your answer</label>
      <textarea id="cl5-answer" class="cl5-writing" data-answer="${key}" spellcheck="true" placeholder="Describe what you found, with examples.">${safe(state.answer[key] || '')}</textarea>
      <div class="cl5-count" data-short="${count(key)<min}"><span id="cl5-wc">${count(key)} words</span><span>Minimum: ${min} words</span></div>
      </div>`;
  }
  function evidence(key, requiredImage=false, details='Link to the page or search result you used.') {
    const data = state.screenshot[key];
    return `<section class="cl5-evidence"><h3>Sources and screenshots</h3>
      <div class="cl5-field"><label for="cl5-source">Source URL *</label><input id="cl5-source" type="url" data-source="${key}" value="${safe(state.source[key] || '')}" placeholder="https://..." autocomplete="off"><small>${safe(details)}</small></div>
      <div class="cl5-field"><label for="cl5-image">Screenshot ${requiredImage?'*':'(optional)'}</label>
       <div class="cl5-upload"><input id="cl5-image" data-image="${key}" type="file" accept="image/png,image/jpeg,image/webp"></div>
       ${data ? `<img class="cl5-thumbnail" src="${data.data}" alt="Uploaded evidence screenshot"><span class="cl5-help">Attached: ${safe(data.name)}</span> <button class="cl5-link-danger" type="button" data-remove-image="${key}">Remove screenshot</button>` : `<small>${requiredImage?'Required: show your actual search and results.':'Add evidence from the corpus interface when useful.'} Screenshots are compressed and included in the PDF report.</small>`}
       </div></section>`;
  }
  function queryField(key,index) {
    return `<div class="cl5-field"><label for="cl5-query-${index}">Analysis ${index} — query and settings *</label><input id="cl5-query-${index}" type="text" data-query="${key}_${index}" value="${safe(state.query[key+'_'+index]||'')}" placeholder="Search term, filters, settings…"><small>Record the exact query and settings.</small></div>`;
  }
  function screenshotField(key,index){
    const id=`${key}_${index}`, data=state.screenshot[id];
    return `<div class="cl5-field"><label for="cl5-image-${index}">Analysis ${index} — screenshot *</label><input id="cl5-image-${index}" type="file" data-image="${id}" accept="image/png,image/jpeg,image/webp">
      ${data?`<div class="cl5-evidence-file"><img class="cl5-thumbnail" src="${data.data}" alt="Attached screenshot"><span>${safe(data.name)}</span><button class="cl5-link-danger" type="button" data-remove-image="${id}">Remove</button></div>`:''}</div>`;
  }
  function setup() {
    return header('Students and corpora',1,
      "Enter both students' names and the two corpus platforms assigned to you.") +
      `<div class="cl5-duo">${input('name1','Student 1 — full name','',{required:true})}${input('name2','Student 2 — full name','',{required:true})}</div><hr class="cl5-rule">`+
      `<div class="cl5-duo">${input('aName','Corpus A — name','',{required:true})}${input('aUrl','Corpus A — website','https://',{type:'url',required:true})}</div>`+
      `<div class="cl5-duo">${input('bName','Corpus B — name','',{required:true})}${input('bUrl','Corpus B — website','https://',{type:'url',required:true})}</div>`+
      `<p class="cl5-help">Read Table 1 of Akishev (2026) before starting.</p>`+
      `<div class="cl5-integrity"><strong>Writing rule.</strong> Type your written answers; do not paste text from websites or AI tools. Each blocked paste attempt carries a <strong>50-point deduction</strong> (maximum 100). Names, URLs and search queries may be pasted. Contact your instructor if you need an accessibility accommodation.</div>`;
  }
  function profile(which) {
    const side=which.toLowerCase(),key=side+'_profile', name=corpusName(side);
    const prompt=`Read the official information about <strong>${safe(name)}</strong>. Who compiled it? Which languages, years and types of texts does it cover? Where did the texts come from? Give its size, if stated. Note any missing details.`;
    return header(`${name} — sources and content`,which==='A'?2:4,prompt)+
      textarea(key,80)+evidence(key,false,'Link to the corpus description or methodology.');
  }
  function trial(which) {
    const side=which.toLowerCase(),key=side+'_trial',name=corpusName(side);
    const prompt=`Run <strong>two different analyses</strong> in <strong>${safe(name)}</strong>, such as a concordance and a collocation search. Record your queries and settings. Describe the results and any problems you encountered. Upload a screenshot.`;
    return header(`${name} — search tools`,which==='A'?3:5,prompt)+
      `<div class="cl5-analysis-pair"><div class="cl5-analysis-item">${queryField(key,1)}${screenshotField(key,1)}</div><div class="cl5-analysis-item">${queryField(key,2)}${screenshotField(key,2)}</div></div>`+
      textarea(key,120)+`<section class="cl5-evidence"><h3>Source</h3><div class="cl5-field"><label for="cl5-source">Result or tool URL *</label><input id="cl5-source" type="url" data-source="${key}" value="${safe(state.source[key]||'')}" placeholder="https://..."></div></section>`;
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
      `Check the tools in both platforms. Then look at their documentation, data sources, AI/NLP support and options for repeating a search. Select what you found, then explain any important differences.`)+
      `<div class="cl5-matrix"><h3>Search and analysis</h3>${columns}${tools}<p class="cl5-help">Check at least four tools in each platform.</p>`+
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
      `<section class="cl5-verdict"><div class="cl5-section-number">Final decision</div><h3>Which platform would you use?</h3>`+
      `<div class="cl5-field"><label for="cl5-decision">Your choice</label><select id="cl5-decision" data-decision>${decisionOptions.map(([value,label])=>`<option value="${safe(value)}" ${state.decision===value?'selected':''}>${safe(label)}</option>`).join('')}</select></div>`+
      `<p class="cl5-question">Explain your choice. Suggest one improvement for each platform and mention one limitation of your comparison.</p>`+
      textarea('comparison',140)+evidence('comparison',false,'Link to a source or result you referred to.');
  }
  function validation() {
    const issues=[];
    for (const [k,label] of [['name1','Student 1'],['name2','Student 2'],['aName','First corpus name'],['bName','Second corpus name']])
      if (!String(state[k]||'').trim()) issues.push(`Enter ${label}.`);
    for (const [k,label] of [['aUrl','First corpus website'],['bUrl','Second corpus website']])
      if (!isHttp(state[k])) issues.push(`Enter a valid ${label}.`);
    for (const d of defs.filter(x=>x.min))
      if (count(d.key)<d.min) issues.push(`${d.key==='comparison'?'Final decision':d.key==='inventory'?'Features and documentation':d.key.startsWith('a_')?corpusName('a')+': '+d.short:corpusName('b')+': '+d.short}: ${count(d.key)} / ${d.min} words.`);
    for (const k of ['a_profile','a_trial','b_profile','b_trial','inventory','comparison'])
      if (!isHttp(state.source[k])) issues.push(`${k==='inventory'?'Features and documentation':k==='comparison'?'Evaluation':k.startsWith('a_')?corpusName('a'):corpusName('b')}: add a source link.`);
    for (const k of ['a_trial','b_trial']) {
      for(const i of [1,2]){
        if(!String(state.query[k+'_'+i]||'').trim())issues.push(`${k.startsWith('a_')?corpusName('a'):corpusName('b')}: add query ${i}.`);
        if(!state.screenshot[k+'_'+i])issues.push(`${k.startsWith('a_')?corpusName('a'):corpusName('b')}: add screenshot ${i}.`);
      }
    }
    for (const pfx of ['a','b']) {
      if (featureNames.filter(([key])=>(state.features[pfx+'_'+key]||'Not tested')!=='Not tested').length<4)
        issues.push(`Check at least four tools in ${corpusName(pfx)}.`);
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
    const issues=validation();
    const wordTotal=defs.filter(d=>d.min).reduce((n,d)=>n+count(d.key),0)+criteria.reduce((n,c)=>n+wordCount(state.criteriaNotes[c.key]),0);
    const rows=[['Students',`${state.name1||'—'} / ${state.name2||'—'}`],['Platforms',`${corpusName('a')} / ${corpusName('b')}`],['Written work',`${wordTotal} words`],['Evidence',`${Object.keys(state.screenshot).length} screenshots · ${Object.values(state.source).filter(isHttp).length} links`],['Paste deduction',`${pasteDeduction()} points (${state.pastes} recorded attempt${state.pastes===1?'':'s'})`]];
    return header('Review and download',8,'Check your answers and download the PDF report.')+
      `<div class="cl5-aux-heading">Report summary</div><div class="cl5-report-overview">${rows.map(([a,b])=>`<div class="cl5-review-row"><strong>${safe(a)}</strong><span>${safe(b)}</span></div>`).join('')}</div>`+
      `<h3>${issues.length?'Before downloading':'Report ready'}</h3>${issues.length?`<p class="cl5-incomplete">${issues.length} item${issues.length===1?'':'s'} need attention:</p><ul class="cl5-missing-list">${issues.map(x=>`<li>${safe(x)}</li>`).join('')}</ul>`:`<p class="cl5-complete">All required fields are complete.</p>`}`+
      `<label class="cl5-consent"><input id="cl5-consent" type="checkbox" ${state.consent?'checked':''}><span>We wrote the answers ourselves and used our own screenshots. Sources are cited.</span></label>`+
      `<div class="cl5-final-buttons"><button type="button" class="cl5-btn cl5-btn-primary" id="cl5-download" ${issues.length||!state.consent?'disabled':''}>Download PDF report</button><button type="button" class="cl5-btn cl5-btn-light" id="cl5-print" ${issues.length||!state.consent?'disabled':''}>Print / Save as PDF</button>${CONFIG.submissionEndpoint?`<button type="button" class="cl5-btn cl5-btn-light" id="cl5-submit" ${issues.length||!state.consent||state.submitted?'disabled':''}>${state.submitted?'Submitted':'Send to instructor'}</button>`:''}</div>`+
      (CONFIG.submissionEndpoint?`<div class="cl5-field"><label for="cl5-code">Submission code</label><input id="cl5-code" type="password" autocomplete="off" placeholder="Code from your instructor"></div>`:'')+
      `<details class="cl5-backup"><summary>Backup options</summary><div class="cl5-secondary-row"><button type="button" class="cl5-btn cl5-btn-light" data-export-draft>Download draft (.json)</button><button type="button" class="cl5-btn cl5-btn-light" data-open-draft>Open a saved draft</button>${state.submitted?'<button type="button" class="cl5-btn cl5-btn-light" data-new-pair>New report</button>':''}<input type="file" id="cl5-import" accept="application/json,.json" hidden></div><p class="cl5-help">A draft can be reopened on this device or another computer.</p></details>`;
  }
  function render() {
    const step=state.step;
    work.innerHTML=step===0?setup():step===1?profile('A'):step===2?trial('A'):step===3?profile('B'):step===4?trial('B'):step===5?featureInventory():step===6?comparison():review();
    $('#cl5-progress-label').textContent=`Step ${step+1} of ${defs.length} · ${taskShort(step)}`;
    progress.setAttribute('aria-valuenow',String(step+1));
    $('#cl5-progress-bar').style.width=`${100*(step+1)/defs.length}%`;
    $('#cl5-back').disabled=step===0;
    $('#cl5-next').textContent=step===defs.length-1?'Back to start ↺':'Next →';
    autosave();
  }
  function go(next) { state.step=Math.min(defs.length-1,Math.max(0,next)); render(); root.scrollIntoView({behavior:'instant',block:'start'}); }
  $('#cl5-back').addEventListener('click',()=>go(state.step-1));
  $('#cl5-next').addEventListener('click',()=>go(state.step===defs.length-1?0:state.step+1));
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
    else if(el.id==='cl5-code') accessCode=el.value;
    autosave();
  }
  work.addEventListener('input',e=>{if(e.target.matches('input,textarea,select'))updateValue(e.target);});
  work.addEventListener('change',async e=>{
    if(e.target.dataset.image) await storeImage(e.target.dataset.image,e.target.files?.[0]);
    else if(e.target.matches('input,textarea,select'))updateValue(e.target);
    if(e.target.id==='cl5-import')await restoreDraft(e.target.files?.[0]);
  });
  work.addEventListener('click',async e=>{
    const target=e.target.closest('button');if(!target)return;
    if(target.dataset.removeImage){delete state.screenshot[target.dataset.removeImage];render();}
    else if(target.hasAttribute('data-export-draft'))exportDraft();
    else if(target.hasAttribute('data-open-draft'))$('#cl5-import')?.click();
    else if(target.hasAttribute('data-new-pair')){if(confirm('Start a new report? Export the current draft first if you need a copy.')){state=initial();accessCode='';render();}}
    else if(target.id==='cl5-download')await downloadPdf();
    else if(target.id==='cl5-print')printPdf();
    else if(target.id==='cl5-submit')await submit();
  });
  // The restriction is intentionally limited to written answers; names, search
  // strings and links can be pasted normally. It is easy to bypass
  // client-side restrictions, and an event never proves AI use.
  function pasteWarning(event) {
    if(!event.target.matches('.cl5-writing'))return;
    event.preventDefault();
    const now=Date.now(); if(now-lastPasteAt<700)return; lastPasteAt=now;
    state.pastes++; state.pasteLog.push(new Date().toISOString()); autosave();
    const penaltyEl = $('#cl5-penalty');
    if (penaltyEl) penaltyEl.textContent = `Deduction: −${pasteDeduction()} points.`;
    toast(`Paste blocked. −50 points. Remaining: ${remainingPoints()}/100. Attempt ${state.pastes} recorded.`);
  }
  work.addEventListener('paste',pasteWarning);
  work.addEventListener('drop',e=>{if(e.target.matches('.cl5-writing'))pasteWarning(e);});
  work.addEventListener('beforeinput',e=>{if(e.inputType==='insertFromPaste' || e.inputType==='insertFromDrop')pasteWarning(e);});
  // Copy deterrence for on-screen task prompts, not a false DRM claim.
  work.addEventListener('copy',e=>{if(e.target.closest('.cl5-question')){e.preventDefault();toast('Please refer to the task on this page rather than copying its text.');}});
  async function storeImage(key,file) {
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('Choose a PNG, JPG, or WebP image.');return;}
    if(file.size>8*1024*1024){toast('This image exceeds 8 MB. Crop or resize it and try again.');return;}
    try {
      const objectUrl=URL.createObjectURL(file);
      const img=new Image(); img.src=objectUrl; await img.decode();
      const scale=Math.min(1,1350/Math.max(img.width,img.height));
      const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL('image/jpeg',.76);URL.revokeObjectURL(objectUrl);
      state.screenshot[key]={name:file.name.slice(0,90),data};
      render();toast('Screenshot attached and saved locally.');
    } catch(_) {toast('Could not read that screenshot. Try a PNG or JPG.');}
  }
  function exportDraft(){
    const data=JSON.stringify(state,null,2);
    downloadBlob(new Blob([data],{type:'application/json'}),`CL_Lab5_${fileId()}.json`);
  }
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  async function restoreDraft(file){
    if(!file)return;
    try{const value=JSON.parse(await file.text());if(![2,3,4,5].includes(value.version)||!value.answer||!value.source||!value.screenshot||!value.features)throw Error('Invalid draft');
      if(!confirm('Replace the current locally saved lab with this draft?'))return;
      state=migrate(value);render();toast('Saved draft opened.');
    }catch(_){toast('This is not a compatible Lab 5 draft.');}
  }
  const paragraph = s => `<div class="report-answer">${safe(s || '—')}</div>`;
  const reportLink = url => isHttp(url)?`<a href="${safe(url)}">${safe(url)}</a>`:safe(url||'—');
  function createReport(){
    const report=document.createElement('article');report.className='cl5-report-shell';report.id='cl5-report';
    const caption=(key,label='Student screenshot')=>state.screenshot[key]?`<figure class="report-item"><img src="${state.screenshot[key].data}" alt="${safe(label)}"><figcaption>${safe(label)} · ${safe(state.screenshot[key].name)}</figcaption></figure>`:'';
    function entry(key,title,index){
      let details='';
      if(state.query[key+'_1']||state.query[key+'_2'])for(const i of [1,2]){
        if(state.query[key+'_'+i])details+=`<div class="report-meta-line"><b>Analysis ${i}</b><span>${safe(state.query[key+'_'+i])}</span></div>`;
      }
      else if(state.query[key])details+=`<div class="report-meta-line"><b>Queries and settings</b><span>${safe(state.query[key])}</span></div>`;
      if(state.source[key])details+=`<div class="report-meta-line"><b>Source</b><span>${reportLink(state.source[key])}</span></div>`;
      return `<section class="report-entry"><h3>${index} &nbsp; ${safe(title)}</h3>${details}${paragraph(state.answer[key])}${caption(key+'_1',`${title} — analysis 1`)}${caption(key+'_2',`${title} — analysis 2`)}${caption(key,`${title} — search evidence`)}</section>`;
    }
    const featureRows=featureNames.map(([key,label])=>`<tr><th>${safe(label)}</th><td>${safe(state.features['a_'+key]||'Not tested')}</td><td>${safe(state.features['b_'+key]||'Not tested')}</td></tr>`).join('');
    const supportRows=supportFeatures.map(x=>`<tr><th>${safe(x.label)}</th><td>${safe(state.support['a_'+x.key]||'Not tested')}</td><td>${safe(state.support['b_'+x.key]||'Not tested')}</td></tr>`).join('');
    const evaluation=criteria.map((c,i)=>`<section class="report-eval"><div class="report-eval-title"><span>${String(i+1).padStart(2,'0')}</span><h3>${safe(c.label)}</h3></div><div class="report-rating"><div><b>${safe(corpusName('a'))}</b><span>${safe(state.criteria['a_'+c.key]||'Not assessed')}</span></div><div><b>${safe(corpusName('b'))}</b><span>${safe(state.criteria['b_'+c.key]||'Not assessed')}</span></div></div>${paragraph(state.criteriaNotes[c.key])}</section>`).join('');
    const choice=state.decision==='a'?corpusName('a'):state.decision==='b'?corpusName('b'):state.decision==='both'?'Depends on the research task':'Not selected';
    report.innerHTML=`
      <header class="report-top"><span>LING3306 &nbsp;/&nbsp; CORPUS LINGUISTICS</span><span>LAB 05</span></header>
      <div class="report-lede"><div class="report-kicker">RESEARCH LAB REPORT</div><h1>Corpus Platform Review</h1><p>Comparison of two corpus platforms</p></div>
      <div class="report-info"><div><b>Students</b><span>${safe(state.name1)}<br>${safe(state.name2)}</span></div><div><b>Date</b><span>${safe(new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}))}</span></div></div>
      <div class="report-corpora"><div><span>PLATFORM 01</span><h2>${safe(corpusName('a'))}</h2><p>${reportLink(state.aUrl)}</p></div><div><span>PLATFORM 02</span><h2>${safe(corpusName('b'))}</h2><p>${reportLink(state.bUrl)}</p></div></div>
      <div class="report-citation"><b>Reference</b><span>Akishev, T. (2026). Evaluating corpus interface usability for linguistic research: The case of the Kazakh National Corpus. <i>SKASE Journal of Theoretical Linguistics, 23</i>(1), 209–228. <a href="https://doi.org/10.33542/JTL2026-1-11">doi:10.33542/JTL2026-1-11</a></span></div>
      <section class="report-section"><div class="report-section-head"><span>01</span><h2>${safe(corpusName('a'))}</h2></div>
        ${entry('a_profile','Corpus overview','1.1')}${entry('a_trial','Searches and results','1.2')}</section>
      <section class="report-section"><div class="report-section-head"><span>02</span><h2>${safe(corpusName('b'))}</h2></div>
        ${entry('b_profile','Corpus overview','2.1')}${entry('b_trial','Searches and results','2.2')}</section>
      <section class="report-section"><div class="report-section-head"><span>03</span><h2>Features and documentation</h2></div>
        <h3 class="report-subheading">Search and analysis tools</h3><table><thead><tr><th>Feature</th><th>${safe(corpusName('a'))}</th><th>${safe(corpusName('b'))}</th></tr></thead><tbody>${featureRows}</tbody></table>
        <h3 class="report-subheading">Research support</h3><table><thead><tr><th>Criterion</th><th>${safe(corpusName('a'))}</th><th>${safe(corpusName('b'))}</th></tr></thead><tbody>${supportRows}</tbody></table>
        ${paragraph(state.answer.inventory)}<div class="report-meta-line"><b>Source</b><span>${reportLink(state.source.inventory)}</span></div>${caption('inventory','Feature / documentation evidence')}</section>
      <section class="report-section"><div class="report-section-head"><span>04</span><h2>Four-criteria evaluation</h2></div><p class="report-method">Using Table 1 of Akishev (2026). Qualitative judgments based on the students’ tests.</p>
        ${evaluation}</section>
      <section class="report-section"><div class="report-section-head"><span>05</span><h2>Final assessment</h2></div><div class="report-choice"><b>Preferred platform</b><span>${safe(choice)}</span></div>${paragraph(state.answer.comparison)}<div class="report-meta-line"><b>Source</b><span>${reportLink(state.source.comparison)}</span></div>${caption('comparison','Comparison evidence')}</section>
      <section class="report-end"><h2>Submission record</h2><p>Signed in the worksheet: ${state.consent?'Yes':'No'} · Paste attempts recorded in this browser: ${state.pastes} · Recorded deduction: ${pasteDeduction()} points (subject to instructor review).</p>${state.pasteLog.length?`<p>Recorded times: ${safe(state.pasteLog.join(' · '))}</p>`:''}</section>
      <footer class="report-footer">LAB 5 &nbsp; · &nbsp; CORPUS PLATFORM REVIEW &nbsp; / &nbsp; TIMUR AKISHEV</footer>`;
    document.body.appendChild(report);return report;
  }
  function fileId(){return (state.name1||'draft').trim().replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,32)||'draft';}
  function reportName(){return `LING3306_Lab5_${fileId()}.pdf`;}
  async function pdfBlob(){
    if(typeof window.html2pdf!=='function')throw new Error('Direct PDF download requires the PDF library; use Print / Save as PDF instead.');
    const el=createReport();el.classList.add('report-visible');
    try{
      await Promise.all(Array.from(el.images).map(img=>img.complete?Promise.resolve():img.decode().catch(()=>{})));
      const opts={margin:[12,13,13,13],filename:reportName(),image:{type:'jpeg',quality:.92},html2canvas:{scale:1.8,backgroundColor:'#ffffff',useCORS:false,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['.report-corpora','.report-entry h3','.report-eval','.report-item','tr']}};
      const worker=window.html2pdf().set(opts).from(el).toPdf();
      const pdf=await worker.get('pdf');
      const total=pdf.internal.getNumberOfPages();
      for(let i=1;i<=total;i++){
        pdf.setPage(i);
        pdf.setDrawColor(208,216,223);pdf.setLineWidth(.2);pdf.line(13,282,197,282);
        pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(115,129,141);
        pdf.text('LING3306  /  LAB 5',13,288);
        pdf.text(`${i} / ${total}`,197,288,{align:'right'});
      }
      return pdf.output('blob');
    } finally {el.remove();}
  }
  async function downloadPdf(){if(busy)return;busy=true;toast('Preparing your PDF report…');try{downloadBlob(await pdfBlob(),reportName());toast('PDF downloaded.');}catch(e){toast(e.message || 'PDF could not be generated. Try Print / Save as PDF.');}finally{busy=false;}}
  function printPdf(){const el=createReport();el.classList.add('report-visible');const cleanup=()=>{el.remove();window.removeEventListener('afterprint',cleanup);};window.addEventListener('afterprint',cleanup);setTimeout(()=>{window.print();setTimeout(cleanup,2000);},80);}
  async function submit(){
    if(!CONFIG.submissionEndpoint){toast('Submission is not configured. Download the PDF instead.');return;}
    const issues=validation();if(issues.length){toast('Complete the missing required fields before submitting.');return;}
    if(!state.consent){toast('Confirm the declaration before submitting.');return;}
    if(!accessCode){toast('Enter the submission code.');return;}
    if(busy)return;
    if(!confirm(`Send the PDF for ${state.name1} and ${state.name2}? This cannot be undone.`))return;
    busy=true;const button=$('#cl5-submit');button.disabled=true;button.textContent='Submitting…';
    try{
      const blob=await pdfBlob();
      const data=new FormData();data.append('pdf',blob,reportName());
      data.append('student1',state.name1);data.append('student2',state.name2);data.append('corpusA',state.aName);data.append('corpusB',state.bName);
      data.append('code',accessCode);data.append('pasteAttempts',String(state.pastes));data.append('pasteDeduction',String(pasteDeduction()));
      const response=await fetch(CONFIG.submissionEndpoint,{method:'POST',body:data});
      const result=await response.json().catch(()=>({error:'Unexpected server response'}));
      if(!response.ok||!result.ok)throw Error(result.error||'Submission failed');
      state.submitted=true;autosave();render();toast('Submission accepted by the server. Keep a copy of your PDF.');
    }catch(e){button.disabled=false;button.textContent='Send to instructor';toast(`Submission not confirmed: ${e.message}. Download a PDF backup.`);}finally{busy=false;accessCode='';}
  }
  render();
})();
