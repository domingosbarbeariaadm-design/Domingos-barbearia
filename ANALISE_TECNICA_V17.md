# Relatório técnico - Domingos Barbearia V17

## O que falta para o sistema ficar completo (escopo oficial + produção)

## 1) Segurança e acesso
- Login com sessão real (hoje é local, sem backend de autenticação robusta).
- Recuperação de senha de verdade (token por e-mail/SMS/WhatsApp).
- Perfis/permissões granulares por módulo (admin, barbeiro, financeiro).
- Remover senha padrão fraca e aplicar política de senha.
- Auditoria de ações críticas (quem excluiu/alterou e quando).

## 2) Banco de dados e proteção de dados
- Migrar de `localStorage` para banco persistente em servidor (Supabase/Postgres/Firebase etc.).
- Backup automático e restauração com versionamento (não só export/import manual).
- Estratégia anti-perda de dados: logs, snapshots e rollback.
- Controle de concorrência (evitar conflitos com múltiplos usuários).

## 3) Agenda e operação diária
- Fluxo completo de confirmação com histórico (pendente/confirmado/finalizado/cancelado).
- Regras mais rígidas de conflito de horário e encaixe.
- Recorrência com gestão de série (editar só 1 ocorrência ou todas).
- No-show com regras de cobrança e bloqueio opcional.

## 4) Financeiro
- Fechamento de caixa com rotina formal por turno/dia e trilha de auditoria.
- DRE simplificada e conciliação por método de pagamento.
- Regras fiscais mínimas (numeração, consistência de lançamentos, exportação contábil).
- Relatórios financeiros mais completos (inadimplência, margem por serviço, evolução mensal).

## 5) Clientes, planos e fidelidade
- Importação em massa com validação e deduplicação inteligente.
- Histórico consolidado por cliente (agenda + financeiro + produtos + fidelidade).
- Planos com renovação automática/alertas configuráveis e bloqueio por vencimento.
- Fidelidade com regras configuráveis por serviço/campanha.

## 6) Mobile, UX e qualidade
- Melhorar usabilidade da agenda em telas pequenas (menos rolagem horizontal).
- Fluxos mobile-first para cadastro rápido e fechamento de atendimento.
- Acessibilidade (contraste, foco teclado, labels consistentes).
- Testes automatizados (unitário/integrado/E2E) para reduzir regressão.

## 7) Deploy/Netlify/PWA
- Para Netlify estático: publicar é possível, mas sem backend o risco operacional continua.
- Para PWA real: adicionar `manifest.json`, service worker e estratégia offline/sync.
- Monitoramento em produção (erros JS, disponibilidade e métricas de uso).

## 8) Prioridade recomendada (ordem prática)
1. Banco em servidor + autenticação robusta.
2. Permissões por perfil + auditoria.
3. Backup automático/versionado.
4. Ajustes mobile da agenda.
5. PWA completa + observabilidade.
