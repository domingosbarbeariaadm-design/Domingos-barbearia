(function(){
  const $=id=>document.getElementById(id);
  const n=v=>Number(String(v||0).replace(',','.'));
  const money=v=>(typeof window.money==='function'?window.money(v):String(v));
  const today=()=> (typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10));

  function ensureReceivableExtraFields(){
    const title=$('editorTitle'); const body=$('editorBody');
    if(!title || !body) return;
    if((title.innerText||'').toLowerCase().indexOf('conta a receber')===-1) return;
    if($('eObs')) return;
    const html = `
      <div class="field"><label>Observação</label><input id="eObs" type="text" value=""></div>
      <div class="field"><label>Status inicial</label>
        <select id="eRecStatus">
          <option value="pendente">Pendente</option>
          <option value="parcial">Parcial</option>
          <option value="pago">Pago</option>
        </select>
      </div>`;
    body.insertAdjacentHTML('beforeend', html);
  }

  const _edit=window.edit;
  if(typeof _edit==='function' && !window.__mod_receivable_edit__){
    window.edit=function(){
      const out=_edit.apply(this,arguments);
      setTimeout(ensureReceivableExtraFields,0);
      return out;
    }
    window.__mod_receivable_edit__=true;
  }

  const _saveRec=window.saveReceivable;
  if(typeof _saveRec==='function' && !window.__mod_save_receivable__){
    window.saveReceivable=function(){
      const c=(window.db.clients||[]).find(x=>x.id==$('eClient')?.value);
      if(!c){ alert('Selecione um cliente.'); return; }
      const value=n($('eValue')?.value);
      const status=$('eRecStatus')?.value||'pendente';
      const paid=status==='pago';
      const paidValue=status==='pago'?value:(status==='parcial'?Math.min(value,n(prompt('Valor já pago nesta dívida?',0)||0)):0);
      const balance=Math.max(0,value-paidValue);
      const rec={id:window.id(),clientId:c.id,client:c.name,desc:$('eDesc')?.value||'Dívida',value:balance,originalValue:value,balance,due:$('eDue')?.value||today(),paid,source:'manual',paidValue,payments:[],obs:$('eObs')?.value||'',status:status};
      if(paidValue>0){rec.payments.push({date:today(),value:paidValue,obs:'Importação manual',pay:'Pix'});}      
      window.db.receivables.push(rec);
      if(typeof window.save==='function') window.save();
      if(typeof window.nav==='function') window.nav('receber');
    }
    window.__mod_save_receivable__=true;
  }


  window.sendChargeByReceivable=function(receivableId){
    const r=(window.db.receivables||[]).find(x=>x.id===receivableId); if(!r) return;
    const c=(window.db.clients||[]).find(x=>x.id===r.clientId);
    const saldo=(r.balance!==undefined?r.balance:r.value)||0;
    const msg=`Olá ${r.client}, tudo bem? Consta pendente ${money(saldo)} referente a ${r.desc||'atendimento'}.`;
    if(typeof window.openWhats==='function') window.openWhats((c&&c.phone)||'', msg);
  }

  window.sendDueReminder=function(receivableId){
    const r=(window.db.receivables||[]).find(x=>x.id===receivableId); if(!r) return;
    const c=(window.db.clients||[]).find(x=>x.id===r.clientId);
    const msg=`Olá ${r.client}, passando para lembrar do vencimento em ${r.due||'-'} no valor de ${money(r.balance!==undefined?r.balance:r.value)}.`;
    if(typeof window.openWhats==='function') window.openWhats((c&&c.phone)||'', msg);
  }

  window.sendScheduleConfirmByClient=function(clientId){
    const a=(window.db.appointments||[]).filter(x=>String(x.clientId)===String(clientId) && (x.date||'')>=today()).sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time))[0];
    if(!a) return alert('Cliente sem horário futuro.');
    if(typeof window.sendConfirm==='function') window.sendConfirm(a.id);
  }
})();
