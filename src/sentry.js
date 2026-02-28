import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export default Sentry;
```

**2. Cria o `.env` na raiz do projeto:**
```
REACT_APP_SENTRY_DSN=https://2445c9e4266d37bc87c00968c9907db0@o4510960595763200.ingest.us.sentry.io/4510960599957504