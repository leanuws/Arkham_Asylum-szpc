# Rastreador de Hábitos + Mapa de Evolução

App mobile (PWA instalável, funciona offline) baseado nas fichas *Rastreador de Hábitos* e *Mapa de Evolução*.

## Abas
- **Hoje** – marque os hábitos do dia com um toque; tira de dias para navegar; sequência 🔥 e progresso até a próxima recompensa.
- **Mês** – a grade completa (hábito × dias 1–31), com total por dia e % por hábito.
- **Progresso** – gráfico de hábitos feitos por dia, **Escada de Recompensas** (1 hábito = 1 bloco, marcos desbloqueiam prêmios) e **Reflexão do mês** com rascunho automático.
- **Evolução** – gráfico radar dos pilares (3 a 8), tabela Meta / Feito / Nível (feito ÷ meta × 10), "Como ler" automático e comparação com o mês anterior.
- **Ajustes** – hábitos (nome, cor, pilar, ordem), pilares (nome, cor, meta), recompensas (marco e prêmio), tema claro/escuro, cor de destaque, backup/importação e exemplo.

Pilares ligados a hábitos somam os ✓ automaticamente; pilares sem hábitos usam contagem manual (− / +).
Cada mês novo herda hábitos, pilares e recompensas do mês anterior, com marcações zeradas.

## Rodar / instalar
É só HTML/CSS/JS, sem build. Sirva a pasta por HTTP (ex.: `python3 -m http.server`) ou publique no GitHub Pages
e abra no celular:
- **Android (Chrome):** Ajustes → *Instalar app* (ou menu ⋮ → Instalar app).
- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.

Os dados ficam no próprio aparelho (localStorage). Use *Exportar backup* para levar a outro celular.
