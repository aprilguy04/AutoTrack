# Frontend App

Vite + React + TypeScript SPA, отражающая роли (гость, клиент, механик, админ) и работающая с API.

## Скрипты
```bash
npm install
npm run dev      # http://localhost:5173 с proxy /api -> 3001
npm run build    # tsc проверка + vite build
npm run preview  # проверка собранной версии
```

## Структура
- `src/pages` — страницы для различных ролей.
- `src/features/orders` — хук `useOrders`.
- `src/widgets` — визуальные компоненты (таймлайн заказов).
- `src/providers` — React Query, глобальные провайдеры.
- `src/shared` — HTTP клиент, типы.

UI пока статичен, но готов к подключению реальных данных и дизайна (можно добавить Tailwind/Chakra на основе текущей конфигурации).

