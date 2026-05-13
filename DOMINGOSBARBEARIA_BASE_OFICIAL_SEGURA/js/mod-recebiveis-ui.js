(function(){
  function byId(id){ return document.getElementById(id); }
  function n(v){ return Number(v||0); }
  function money(v){ return (typeof window.money==='function')?window.money(v):String(v); }

  function renderReceberTotalizador(){
    const list = byId('receberList');
    if(!list || !window.db) return;
    const q = (byId('receberSearch')?.value||'').toLowerCase();
    const rows = (window.db.receivables||[]).filter(r=>{
      const txt = [r.client,r.desc,r.orderNo,r.due].join(' ').toLowerCase();
      return !q || txt.includes(q);
    });
    const pend = rows.filter(r=>!r.paid).reduce((s,r)=>s+n(r.balance!==undefined?r.balance:r.value),0);
    const pagos = rows.filter(r=>r.paid||n(r.balance)<=0).reduce((s,r)=>s+n(r.paidValue||r.originalValue||0),0);
    const parcial = rows.filter(r=>!r.paid&&n(r.paidValue)>0&&n(r.balance)>0).reduce((s,r)=>s+n(r.balance),0);
    let box = byId('receberTotalizador');
    if(!box){ box=document.createElement('div'); box.id='receberTotalizador'; box.className='card'; list.parentNode.insertBefore(box,list); }
    box.innerHTML = `<b>Totalizador</b><div class="small">Pendente: ${money(pend)} • Pago: ${money(pagos)} • Parcial(saldo): ${money(parcial)} • Registros: ${rows.length}</div>`;
  }

  const _render = window.render;
  if(typeof _render==='function' && !window.__mod_receber_ui__){
    window.render = function(){ const out=_render.apply(this,arguments); try{ renderReceberTotalizador(); }catch(e){} return out; };
    window.__mod_receber_ui__=true;
  }
})();
