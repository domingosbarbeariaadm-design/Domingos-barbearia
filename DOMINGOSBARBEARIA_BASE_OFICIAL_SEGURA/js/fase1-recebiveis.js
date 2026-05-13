(function(){
  function byId(id){ return document.getElementById(id); }
  function n(v){ return Number(v||0); }
  function money(v){ return (typeof window.money==='function')?window.money(v):String(v); }

  // 1) Integração com agenda ao concluir: pago/parcial/pendente no fechamento
  const _finishWithProduct = window.finishWithProduct;
  if (typeof _finishWithProduct === 'function' && !window.__fase1_finish_patched__) {
    window.finishWithProduct = function(i){
      const payStatus = byId('ePayStatus') ? byId('ePayStatus').value : 'pendente';
      const paidNow = byId('ePaidNow') ? Number(String(byId('ePaidNow').value||0).replace(',','.')) : 0;
      const res = _finishWithProduct.call(this, i);
      try {
        const a = (window.db&&window.db.appointments||[]).find(x=>String(x.id)===String(i));
        if(!a || !a.orderNo) return res;
        const r = (window.db&&window.db.receivables||[]).find(x=>x.orderNo===a.orderNo);
        if(!r) return res;
        if(payStatus==='pago' && typeof window.addReceivablePayment==='function'){
          window.addReceivablePayment(r, n(r.balance!==undefined?r.balance:r.value), 'Baixa total no fechamento');
        } else if(payStatus==='parcial' && paidNow>0 && typeof window.addReceivablePayment==='function'){
          window.addReceivablePayment(r, Math.min(n(r.balance!==undefined?r.balance:r.value), paidNow), 'Baixa parcial no fechamento');
        }
      } catch(e){}
      return res;
    };
    window.__fase1_finish_patched__ = true;
  }

  // 2) Tela visual receber: totalizador dinâmico sem trocar layout base
  const _renderReceivables = window.renderReceivables;
  if (typeof _renderReceivables === 'function' && !window.__fase1_recebiveis_patched__) {
    window.renderReceivables = function(){
      const out = _renderReceivables.apply(this, arguments);
      try{
        const list = byId('receberList');
        if(!list || !window.db) return out;
        const q = (byId('receberSearch')?.value||'').toLowerCase();
        const rows = (window.db.receivables||[]).filter(r=>{
          const txt = [r.client,r.desc,r.orderNo,r.due].join(' ').toLowerCase();
          return !q || txt.includes(q);
        });
        const pend = rows.filter(r=>!r.paid).reduce((s,r)=>s+n(r.balance!==undefined?r.balance:r.value),0);
        const pagos = rows.filter(r=>r.paid||n(r.balance)<=0).reduce((s,r)=>s+n(r.paidValue||r.originalValue||0),0);
        const parcial = rows.filter(r=>!r.paid&&n(r.paidValue)>0&&n(r.balance)>0).reduce((s,r)=>s+n(r.balance),0);
        let box = byId('receberTotalizador');
        if(!box){
          box = document.createElement('div');
          box.id='receberTotalizador';
          box.className='card';
          list.parentNode.insertBefore(box, list);
        }
        box.innerHTML = `<b>Totalizador</b><div class="small">Pendente: ${money(pend)} • Pago: ${money(pagos)} • Parcial(saldo): ${money(parcial)} • Registros: ${rows.length}</div>`;
      }catch(e){}
      return out;
    };
    window.__fase1_recebiveis_patched__ = true;
  }

  // 3) Histórico financeiro no cliente (pagamentos + saldo + últimos atendimentos)
  const _clientHistory = window.clientHistory;
  if (typeof _clientHistory === 'function' && !window.__fase1_client_history_patched__) {
    window.clientHistory = function(cid){
      let html = _clientHistory.call(this, cid);
      try{
        const d = window.db||{};
        const rec = (d.receivables||[]).filter(r=>String(r.clientId)===String(cid));
        const saldo = rec.filter(r=>!r.paid).reduce((s,r)=>s+n(r.balance!==undefined?r.balance:r.value),0);
        const pays = rec.flatMap(r=>(r.payments||[]).map(p=>({r,p}))).slice(-8).reverse();
        const atend = (d.appointments||[]).filter(a=>String(a.clientId)===String(cid)).slice(-5).reverse();
        const pagamentosHtml = pays.map(x=>`<div class="list"><div><b>${x.r.desc}</b><div class="small">${x.p.date} • ${money(x.p.value)} • ${x.p.pay||''}</div></div></div>`).join('')||'<p class="small">Sem pagamentos.</p>';
        const atendHtml = atend.map(a=>`<div class="list"><div><b>${a.date} ${a.time}</b><div class="small">${a.service} • ${a.status||''}</div></div></div>`).join('')||'<p class="small">Sem atendimentos.</p>';
        html += `<h4>Financeiro do cliente</h4><p><span class="tag">Saldo pendente ${money(saldo)}</span><span class="tag">Pagamentos ${pays.length}</span></p><h4>Pagamentos</h4>${pagamentosHtml}<h4>Últimos atendimentos</h4>${atendHtml}`;
      }catch(e){}
      return html;
    };
    window.__fase1_client_history_patched__ = true;
  }
})();
