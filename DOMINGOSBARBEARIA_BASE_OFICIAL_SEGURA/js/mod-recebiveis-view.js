(function(){
  const $=id=>document.getElementById(id);
  const n=v=>Number(v||0);
  const money=v=>(typeof window.money==='function'?window.money(v):String(v));
  const today=()=> (typeof window.today==='function'?window.today():new Date().toISOString().slice(0,10));
  const txt=v=>String(v||'').toLowerCase();

  function saldo(r){ return n(r.balance!==undefined?r.balance:r.value); }
  function recebido(r){ return n(r.paidValue||0); }
  function isParcial(r){ return !r.paid && recebido(r)>0 && saldo(r)>0; }
  function isVencido(r){ return !r.paid && saldo(r)>0 && String(r.due||'')<today(); }

  function filtra(rows){
    const f=window.recFilter||'todos';
    if(f==='pendentes') return rows.filter(r=>!r.paid&&saldo(r)>0);
    if(f==='pagos') return rows.filter(r=>r.paid||saldo(r)<=0);
    if(f==='parcial') return rows.filter(isParcial);
    if(f==='vencidos') return rows.filter(isVencido);
    return rows;
  }

  function resumo(rows){
    const pend=rows.filter(r=>!r.paid).reduce((s,r)=>s+saldo(r),0);
    const rec=rows.reduce((s,r)=>s+recebido(r),0);
    const venc=rows.filter(isVencido).reduce((s,r)=>s+saldo(r),0);
    return {pend,rec,venc};
  }

  function historicoCliente(clientId){
    const d=window.db||{};
    const at=(d.appointments||[]).filter(a=>String(a.clientId)===String(clientId)).slice(-5).reverse();
    const recs=(d.receivables||[]).filter(r=>String(r.clientId)===String(clientId));
    const pays=recs.flatMap(r=>(r.payments||[]).map(p=>({r,p}))).slice(-8).reverse();
    const sal=recs.filter(r=>!r.paid).reduce((s,r)=>s+saldo(r),0);
    const atend=at.map(a=>`<div class="small">• ${a.date} ${a.time||''} — ${a.service||''} (${a.status||''})</div>`).join('')||'<div class="small">Sem atendimentos.</div>';
    const pg=pays.map(x=>`<div class="small">• ${x.p.date} — ${money(x.p.value)} — ${x.p.pay||''} (${x.r.desc||''})</div>`).join('')||'<div class="small">Sem pagamentos.</div>';
    return `<div class="card" style="margin-top:8px;background:#101010"><b>Histórico financeiro</b><div class="small">Saldo pendente: ${money(sal)}</div><div style="margin-top:6px"><b>Atendimentos</b>${atend}</div><div style="margin-top:6px"><b>Pagamentos</b>${pg}</div></div>`;
  }


  window.receiveAmountPrompt = function(id){
    if(typeof window.receivePartial==='function') return window.receivePartial(id);
  }

  window.toggleReceberHistorico = function(clientId){
    window.__receberHistCli = (window.__receberHistCli===clientId?'':clientId);
    if(typeof window.renderReceivables==='function') window.renderReceivables();
  }

  const old = window.renderReceivables;
  if(typeof old==='function' && !window.__mod_receber_view__){
    window.renderReceivables = function(){
      const d=window.db||{};
      const q=txt($('receberSearch')?.value||'');
      let rows=(d.receivables||[]).filter(r=>txt([r.client,r.desc,r.orderNo,r.due].join(' ')).includes(q));
      rows=filtra(rows);

      const r=resumo(rows);
      const cards=`<div class="cards"><div class="card">Total pendente<div class="big">${money(r.pend)}</div></div><div class="card">Total recebido<div class="big">${money(r.rec)}</div></div><div class="card">Total vencido<div class="big">${money(r.venc)}</div></div></div>`;

      const groups={};
      rows.forEach(x=>{ const k=x.clientId||x.client||'sem_cliente'; (groups[k]=groups[k]||{clientId:x.clientId,client:x.client||'Sem cliente',items:[]}).items.push(x); });
      const html=Object.values(groups).map(g=>{
        const sal=g.items.filter(x=>!x.paid).reduce((s,x)=>s+saldo(x),0);
        const itens=g.items.map(x=>`<div class="card" style="margin-top:8px;background:#101010"><b>${x.desc}</b><div class="small">Venc: ${x.due||'-'} • Saldo: ${money(saldo(x))} • Pago: ${money(recebido(x))}</div><div style="margin-top:8px">${!x.paid?`<button class="btn" onclick="receiveAmountPrompt('${x.id}')">Receber valor</button><button class="btn light" onclick="receivePartial('${x.id}')">Pagamento parcial</button><button class="btn green" onclick="markPaid('${x.id}')">Marcar como pago</button>`:''}<button class="btn light" onclick="toggleReceberHistorico('${g.clientId||''}')">Visualizar histórico</button><button class="btn light" onclick="sendChargeByReceivable('${x.id}')">Cobrar cliente</button><button class="btn light" onclick="sendScheduleConfirmByClient('${g.clientId||''}')">Confirmar horário</button><button class="btn light" onclick="sendDueReminder('${x.id}')">Lembrar vencimento</button></div></div>`).join('');
        const hist=(window.__receberHistCli===g.clientId)?historicoCliente(g.clientId):'';
        return `<div class="card"><div class="list"><div><b>${g.client}</b><div class="small">Saldo pendente: ${money(sal)}</div></div><div><button class="btn light" onclick="receiveClientPartial('${g.clientId||''}')">Pagamento parcial</button><button class="btn green" onclick="receiveClientTotal('${g.clientId||''}')">Quitar cliente</button></div></div>${itens}${hist}</div>`;
      }).join('') || '<p class="small">Nenhum recebível encontrado.</p>';

      $('receberList').innerHTML = cards + html;
    };
    window.__mod_receber_view__=true;
  }
})();
