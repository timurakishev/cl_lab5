/* Lab 5 PDF report. Uses Canvas and a small PDF writer: no CDN or downloads. */
(() => {
  'use strict';
  const WIDTH = 760;
  const HEIGHT = 1075; // A4 ratio
  const SCALE = 1.45;
  const LEFT = 58;
  const RIGHT = WIDTH - LEFT;
  const FOOT = HEIGHT - 62;
  const MAXY = HEIGHT - 96;
  const colors = {ink:'#233441', muted:'#5e7180', faint:'#dee5e9', blue:'#3d657e'};
  const bytes = s => new TextEncoder().encode(s);
  const str = value => String(value == null ? '' : value);
  function createPDF(jpegs) {
    // Construct a valid PDF 1.4 with one JPEG-backed A4 page for each canvas.
    const objects = new Map(), pages=[];
    objects.set(1, bytes('<< /Type /Catalog /Pages 2 0 R >>'));
    const media = '[0 0 595.28 841.89]';
    jpegs.forEach((jpeg,i) => {
      const pid=3+i*3, iid=pid+1, cid=pid+2;
      pages.push(`${pid} 0 R`);
      objects.set(pid, bytes(`<< /Type /Page /Parent 2 0 R /MediaBox ${media} /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`));
      const raw=Uint8Array.from(atob(jpeg.split(',')[1]), c=>c.charCodeAt(0));
      const imgHeader=bytes(`<< /Type /XObject /Subtype /Image /Width ${Math.round(WIDTH*SCALE)} /Height ${Math.round(HEIGHT*SCALE)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${raw.length} >>\nstream\n`);
      objects.set(iid, merge([imgHeader,raw,bytes('\nendstream')]));
      const content=bytes('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q');
      objects.set(cid,merge([bytes(`<< /Length ${content.length} >>\nstream\n`),content,bytes('\nendstream')]));
    });
    objects.set(2,bytes(`<< /Type /Pages /Kids [${pages.join(' ')}] /Count ${pages.length} >>`));
    const out=[bytes('%PDF-1.4\n%\xC2\xB5\xC2\xB5\n')], offsets=[0];
    let offset=out[0].length;
    for(let i=1;i<=2+jpegs.length*3;i++){
      offsets[i]=offset;
      const obj=merge([bytes(`${i} 0 obj\n`),objects.get(i),bytes('\nendobj\n')]);
      out.push(obj);offset+=obj.length;
    }
    const xrefStart=offset;
    const xref=`xref\n0 ${offsets.length}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+
      `trailer\n<< /Root 1 0 R /Size ${offsets.length} >>\nstartxref\n${xrefStart}\n%%EOF`;
    out.push(bytes(xref));
    return new Blob(out,{type:'application/pdf'});
  }
  function merge(parts){const length=parts.reduce((sum,p)=>sum+p.length,0),result=new Uint8Array(length);let offset=0;for(const p of parts){result.set(p,offset);offset+=p.length;}return result;}
  class Report {
    constructor(state,meta){this.s=state;this.m=meta;this.pages=[];this.c=null;this.ctx=null;this.y=0;this.page();}
    page(){
      const canvas=document.createElement('canvas');canvas.width=Math.round(WIDTH*SCALE);canvas.height=Math.round(HEIGHT*SCALE);
      const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas is unavailable.');
      ctx.scale(SCALE,SCALE);ctx.fillStyle='white';ctx.fillRect(0,0,WIDTH,HEIGHT);
      this.c=canvas;this.ctx=ctx;this.pages.push(canvas);this.y=87;
      ctx.fillStyle=colors.muted;ctx.font='700 12px Arial, sans-serif';ctx.fillText('LING3306   CORPUS LINGUISTICS',LEFT,36);
      ctx.textAlign='right';ctx.fillText('LAB 05',RIGHT,36);ctx.textAlign='left';
      this.rule(49,2,colors.ink);
    }
    rule(y,width=1,color=colors.faint){this.ctx.fillStyle=color;this.ctx.fillRect(LEFT,y,RIGHT-LEFT,width);}
    ensure(h){if(this.y+h>MAXY)this.page();}
    style(size=14,bold=false,color=colors.ink){this.ctx.font=`${bold?'700':'400'} ${size}px Arial, 'Noto Sans', sans-serif`;this.ctx.fillStyle=color;}
    wrap(raw,width,size=14,bold=false){
      this.style(size,bold);
      const out=[];
      for(const para of str(raw).split(/\r?\n/)){
        if(!para.trim()){out.push('');continue;}
        let line='';
        const tokens=para.trim().split(/\s+/u);
        for(let part of tokens){
          // Break links or other long unspaced strings without clipping.
          if(this.ctx.measureText(part).width>width){
            if(line){out.push(line);line='';}
            let chunk='';for(const ch of part){if(chunk&&this.ctx.measureText(chunk+ch).width>width){out.push(chunk);chunk=ch;}else chunk+=ch;}
            part=chunk;
          }
          const combined=line?`${line} ${part}`:part;
          if(line&&this.ctx.measureText(combined).width>width){out.push(line);line=part;}else line=combined;
        }
        if(line)out.push(line);
      }
      return out;
    }
    text(raw,{size=14,bold=false,color=colors.ink,gap=7,line=21,indent=0}={}){
      const lines=this.wrap(raw,RIGHT-LEFT-indent,size,bold);
      if(!lines.length)return;
      this.style(size,bold,color);
      for(const l of lines){this.ensure(line);this.style(size,bold,color);if(l)this.ctx.fillText(l,LEFT+indent,this.y);this.y+=line;}
      this.y+=gap;
    }
    heading(title,number=''){
      this.ensure(100);this.y+=23;
      this.rule(this.y,2,colors.ink);this.y+=29;
      if(number)this.text(number,{size:11,bold:true,color:colors.blue,gap:3,line:16});
      this.text(title,{size:21,bold:true,gap:16,line:28});
    }
    sub(title){this.ensure(65);this.y+=10;this.text(title,{size:16,bold:true,gap:11,line:24});}
    small(label,val){
      if(!str(val).trim())return;
      this.ensure(48);
      this.text(label.toUpperCase(),{size:10,bold:true,color:colors.muted,gap:2,line:14});
      this.text(val,{size:12,color:colors.ink,gap:9,line:18});
    }
    table(headers,rows,widths=[.42,.29,.29]){
      const x=[LEFT,LEFT+widths[0]*(RIGHT-LEFT),LEFT+(widths[0]+widths[1])*(RIGHT-LEFT)];
      const w=widths.map(n=>n*(RIGHT-LEFT));
      const head=()=>{
        this.ensure(50);this.ctx.fillStyle='#e9eff3';this.ctx.fillRect(LEFT,this.y-8,RIGHT-LEFT,34);
        headers.forEach((label,i)=>{this.style(12,true,colors.ink);const parts=this.wrap(label,w[i]-16,12,true);this.ctx.fillText((parts[0]||''),x[i]+8,this.y+10);});
        this.y+=35;
      };
      head();
      for(const row of rows){
        const cells=row.map((v,i)=>this.wrap(v,w[i]-16,12,i===0));
        const height=Math.max(34,Math.max(...cells.map(a=>a.length))*17+10);
        if(this.y+height>MAXY){this.page();head();}
        cells.forEach((lines,i)=>{lines.forEach((l,k)=>{this.style(12,i===0,colors.ink);this.ctx.fillText(l,x[i]+8,this.y+15+k*17);});});
        this.ctx.fillStyle=colors.faint;this.ctx.fillRect(LEFT,this.y+height-1,RIGHT-LEFT,1);
        this.y+=height;
      }
      this.y+=15;
    }
    async screenshot(key,caption){
      const saved=this.s.screenshot?.[key];
      const records=(Array.isArray(saved)?saved:saved?[saved]:[]).filter(item=>item?.data);
      for(let index=0;index<records.length;index++){
        const img=new Image();img.src=records[index].data;
        try{await img.decode();}catch(_){continue;}
        const maxWidth=RIGHT-LEFT,maxHeight=365;
        const ratio=Math.min(maxWidth/img.width,maxHeight/img.height,1);
        const h=Math.max(1,img.height*ratio),w=Math.max(1,img.width*ratio);
        this.ensure(h+55);
        const label=records.length>1?`${caption} (${index+1} of ${records.length})`:caption;
        this.text(label,{size:11,bold:true,color:colors.muted,gap:6,line:16});
        this.ctx.fillStyle='#fafbfc';this.ctx.fillRect(LEFT,this.y-4,w+8,h+8);
        this.ctx.drawImage(img,LEFT+4,this.y,w,h);this.y+=h+24;
      }
    }
    async profile(side,n){
      const key=`${side}_profile`,name=side==='a'?this.m.corpusA:this.m.corpusB;
      this.heading(name,n);
      this.sub('Sources and content');
      this.text(this.s.answer?.[key]||'No answer',{line:21});
      this.small('Official corpus information',this.s.source?.[key]);
      await this.screenshot(key,'Corpus overview evidence');
      this.sub('Analytical features');
      for(let i=1;i<=2;i++){
        this.small(`Analysis ${i} - query and settings`,this.s.query?.[`${side}_trial_${i}`]);
        await this.screenshot(`${side}_trial_${i}`,`Analysis ${i} - screenshot`);
      }
      this.sub('Search results and interpretation');
      this.text(this.s.answer?.[`${side}_trial`]||'No answer',{line:21});
    }
    async build(){
      const s=this.s,m=this.m;
      this.text('RESEARCH LAB REPORT',{size:11,bold:true,color:colors.blue,gap:8,line:17});
      this.text('Corpus Platform Review',{size:32,bold:true,line:40,gap:8});
      this.text('LAB 5    |    2026',{size:13,color:colors.muted,gap:30});
      this.rule(this.y,1,colors.faint);this.y+=20;
      this.small('Students',[s.name1,s.name2].filter(Boolean).join(' / '));
      this.small('Date',new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}));
      this.y+=6;
      this.table(['PLATFORM','CORPUS NAME','WEBSITE'],[['01',m.corpusA,s.aUrl],['02',m.corpusB,s.bUrl]],[.16,.30,.54]);
      this.small('Reference','Akishev, T. (2026). Evaluating corpus interface usability for linguistic research: The case of the Kazakh National Corpus. SKASE Journal of Theoretical Linguistics, 23(1), 209-228.');
      await this.profile('a','01');
      await this.profile('b','02');
      this.heading('Features and documentation','03');
      this.sub('Search and analytical features');
      this.table(['FEATURE',m.corpusA,m.corpusB],m.features.map(([key,label])=>[label,s.features?.['a_'+key]||'Not tested',s.features?.['b_'+key]||'Not tested']));
      this.sub('Research support');
      this.table(['AREA',m.corpusA,m.corpusB],m.support.map(item=>[item.label,s.support?.['a_'+item.key]||'Not tested',s.support?.['b_'+item.key]||'Not tested']));
      this.sub('Discussion');this.text(s.answer?.inventory||'No answer');this.small('Documentation / feature URL',s.source?.inventory);
      await this.screenshot('inventory','Evidence - features and documentation');
      this.heading('Four-criteria evaluation','04');
      this.text('Based on Table 1 of Akishev (2026).',{size:12,color:colors.muted,gap:14});
      for(let i=0;i<m.criteria.length;i++){
        const crit=m.criteria[i];this.sub(`${i+1}. ${crit.label}`);
        this.table(['PLATFORM','JUDGMENT',''],[[m.corpusA,s.criteria?.['a_'+crit.key]||'Not assessed',''],[m.corpusB,s.criteria?.['b_'+crit.key]||'Not assessed','']],[.38,.50,.12]);
        this.text(s.criteriaNotes?.[crit.key]||'No explanation',{line:21});
      }
      this.heading('Final decision','05');
      const choice=s.decision==='a'?m.corpusA:s.decision==='b'?m.corpusB:s.decision==='both'?'Depends on the research task':'Not selected';
      this.small('Preferred platform',choice);this.text(s.answer?.comparison||'No answer',{line:21});
      this.ensure(142);this.y+=15;this.rule(this.y,1,colors.faint);this.y+=26;this.text('Submission record',{size:15,bold:true,gap:12,line:23});
      const pastes=Math.max(0,Number(s.pastes)||0);this.small('Academic declaration',s.consent?'Confirmed by students':'Not confirmed');
      this.small('Blocked paste attempts (recorded locally)',String(pastes));
      this.small('Recorded deduction (subject to instructor review)',`${Math.min(pastes*50,100)} points`);
      this.pages.forEach((canvas,index)=>{
        const c=canvas.getContext('2d');c.save();c.fillStyle=colors.faint;c.fillRect(LEFT,FOOT-16,RIGHT-LEFT,1);
        c.font='11px Arial, sans-serif';c.fillStyle=colors.muted;c.fillText('LING3306  /  LAB 5',LEFT,FOOT);
        c.textAlign='right';c.fillText(`${index+1} / ${this.pages.length}`,RIGHT,FOOT);c.restore();
      });
      return createPDF(this.pages.map(canvas=>canvas.toDataURL('image/jpeg',.78)));
    }
  }
  window.CL5Pdf={build:async(state,meta)=>new Report(state,meta).build()};
})();
