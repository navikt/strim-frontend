# Strim Frontend

Frontend-applikasjonen for **Strim**, en løsning for å opprette og administrere møter og arrangementer.

Applikasjonen er bygget med Next.js og React, og bruker NAV sitt Aksel-designsystem for UI-komponenter.

Frontend kommuniserer med Strim Backend via REST API.

---

## 🎯 Hva gjør frontend?

Frontend gir brukeren mulighet til å:

- Se kommende og tidligere arrangementer
- Filtrere arrangementer
- Opprette nye arrangementer
- Melde seg på og av arrangementer
- Se deltakere
- Navigere mellom arrangementer og kategorier
- Se eventuell Slack-kanal tilknyttet arrangement

---

## 🛠 Teknologistack

### Rammeverk og språk
- Next.js (App Router)
- React
- TypeScript

### UI og design
- @navikt/ds-react (Aksel Designsystem)
- @navikt/aksel-icons
- Tailwind CSS (dersom brukt)

### Logging og observability
- @navikt/next-logger
- Grafana Faro

### Autentisering
- Azure AD (OIDC via backend)

---

## 🌍 Miljøvariabler

Frontend må vite hvor backend kjører.

Opprett en `.env.local`-fil i rotmappen:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

I produksjon settes denne til backend-URL i sky.

---

## ▶️ Starte applikasjonen lokalt

### 1. Installer avhengigheter

```bash
npm install
```

eller

```bash
yarn install
```

### 2. Start utviklingsserver

```bash
npm run dev
```

Applikasjonen starter på:

```
http://localhost:3000
```

---

## 🏗 Bygge for produksjon

```bash
npm run build
```

For å starte produksjonsbuild lokalt:

```bash
npm run start
```

---

## 🔐 Autentisering

Frontend bruker Azure AD via backend.

Flyt:

1. Bruker logger inn via Azure
2. Backend validerer JWT
3. Frontend sender med access token ved kall til beskyttede endepunkter

Beskyttede kall inkluderer:

```
POST   /events/create
POST   /events/{id}/join
DELETE /events/{id}/join
```

---

## 📡 API-kommunikasjon

Frontend kommuniserer med backend via REST.

Eksempel på kall:

```
GET    /events
GET    /events/{id}
GET    /categories
POST   /events/create
POST   /events/{id}/join
DELETE /events/{id}/join
```

Base URL styres av:

```
NEXT_PUBLIC_API_URL
```

---

## 🎨 Designsystem

Frontend bruker NAV sitt Aksel-designsystem.

Eksempler på komponenter i bruk:

- Modal
- Button
- TextField
- DatePicker
- Tag
- Loader
- Switch
- Combobox

Dette sikrer universell utforming og konsistent NAV-design.

---

## 🧪 Testing

Dersom testing er satt opp:

```bash
npm run test
```

---

## 🚀 Deploy

Deploy håndteres via:

- GitHub Actions
- Bygg av Next.js-applikasjon
- Publisering til skyplattform

Miljøvariabler settes i deploy-miljøet.

---

## 🔗 Avhengighet

Frontend krever at Strim Backend kjører og er tilgjengelig via API.

Standard lokal oppkobling:

```
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

---

**Vedlikeholdes av NAV IT**
