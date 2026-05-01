# FlowCred — Frontend

Interface **React + TypeScript + Vite** com **TailwindCSS** e componentes no estilo **shadcn/ui** (Radix + CVA), consumindo a API do repositório `FlowCred-Back`.

**Documentação unificada** (comportamento, regras de negócio, APIs e tutoriais): [../DOCUMENTACAO-FlowCred.md](../DOCUMENTACAO-FlowCred.md)

## Stack

- React 19, React Router 7  
- TanStack Query, Axios  
- React Hook Form + Zod  
- TailwindCSS 3, Recharts (dashboard)

## Como rodar

```bash
cp .env.example .env
npm install
npm run dev
```

Use `cp .env.example .env`: o proxy do Vite aponta para **`http://localhost:8001`**, alinhado ao `docker-compose` do backend (`8001:8000`). Se rodar a API com `uvicorn` na máquina na **8000**, altere `VITE_PROXY_TARGET` no `.env` do front.

**Teste rápido após clonar:** suba o backend (Docker ou uvicorn), depois `npm run dev`. Login: **`admin` / `admin`**. Deve existir pelo menos um cliente e uma proposta demo se o backend tiver `SEED_DEV_DATA=1` (padrão no `.env.example` e no Compose).

## Build

```bash
npm run build
npm run preview
```

## Docker

O `Dockerfile` usa `npm run dev` para desenvolvimento. Para produção, prefira build estático + servidor (ex.: nginx) apontando para a mesma `VITE_API_URL` pública da API.

## Telas

- Login  
- Dashboard (cards, gráfico por status, últimas propostas)  
- Clientes (lista, busca, modal criar/editar)  
- Propostas (filtros, nova proposta)  
- Detalhe da proposta (resumo, timeline, checklist, documentos)

## Próximos passos

- Code splitting para reduzir bundle  
- Toasts de feedback (ex.: sonner)  
- Testes E2E (Playwright)
