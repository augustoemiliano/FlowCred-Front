# FlowCred — Frontend

Interface **React + TypeScript + Vite** com **TailwindCSS** e componentes no estilo **shadcn/ui** (Radix + CVA), consumindo a API do repositório `FlowCred-Back`.

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

Por padrão, `VITE_API_URL=/api/v1` e o **Vite proxy** encaminha `/api` para `http://localhost:8000` (ajuste `VITE_PROXY_TARGET` se necessário).

Suba o backend na porta 8000 antes de usar o app.

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
