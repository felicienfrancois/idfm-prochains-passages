# idfm-prochains-passages
Display the next bus, trains, metros, tramways at any station in the Paris area (Ile de France Mobilité).

Published on Netlify at [prochains-passages.fr](https://prochains-passages.fr)

Based on [Nuxt 3](https://nuxt.com/docs/getting-started/introduction) + [TailwindCSS](https://tailwindcss.com/)

Uses [Ile de France Mobilités APIs](https://prim.iledefrance-mobilites.fr)

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install
```

## Development Server

Create a `.env` file at the root of the project to set your [Ile de France Mobilités](https://prim.iledefrance-mobilites.fr) API Key
```
NUXT_PRIM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Start the development server on http://localhost:3000

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Update Stop points and lines databases

Stop points and lines databases are stored locally in data directory (data/stops.json and data/lines.json).
Thoose JSON were generated from the __csv__ stop points database ["Arrêts et lignes associées" provided by Ile de France Mobilités](https://prim.iledefrance-mobilites.fr/jeux-de-donnees/arrets-lignes.

In order to update the local database, you have to re-download the up-to-date source CSV and put it at the root of the project (/arrets-lignes.csv)
Then run the following command :
```
npm run preprocess_data
```
