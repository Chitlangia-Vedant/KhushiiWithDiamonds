
# Khushii With Diamond

## About the project 

### Jewellery web catalog with 
- Dynamic price change according to live gold prices
- Seamless database integration for storing and retrieving data.
- Automatically uploads images to Google Drive along with relevant information, enabling centralized photo collection.

## Built With

* [![Tailwind CSS][tailwind-img]][tailwind-url]

* [![React Hooks][reacthooks-img]][reacthooks-url]

* [![Supabase][supabase-img]][supabase-url]

* [![Lucide React][lucide-img]][lucide-url]

* [![HTML5][html-img]][html-url]

* [![TypeScript][ts-img]][ts-url]

* [![Vite][vite-img]][vite-url]

* [![Node.js][node-img]][node-url]

* [![GitHub Actions][gha-img]][gha-url]

## Getting Started

### Prerequisites

- Supabase account

    [![Supabase][supabase-img]][supabase-url]

- Google account

  [![Google][google-img]][google-url]

- A web hosting platform (if you want to deploy your project online)(Recommended)
    
    You can choose any hosting provider, but I will demonstrate how to deploy it using Netlify and Hostinger

    [![Netlify][netlify-img]][netlify-url]

    [![Hostinger][hostinger-img]][hostinger-url]

- npm (if you want to run locally)

```sh
  npm install npm@latest -g
```

### Google Drive API Setup

### Supabase Setup

- Create a new database at Supabase and get its URL and Key.

- Run the [Final_sql](https://github.com/Violet4Cheetha/KhushiiWithDiamonds/blob/main/supabase/Final_sql.sql) code in its SQL tab.

- Your SQL database should now have jewellery_item,categories and admin_setting tables.

- Create [upload-to-drive](https://github.com/Violet4Cheetha/KhushiiWithDiamonds/blob/main/supabase/upload-to-drive/index.ts) and [delete-from-drive](https://github.com/Violet4Cheetha/KhushiiWithDiamonds/blob/77f52deda1c795d6a22cfd53c8a6e67f51b6dfb4/supabase/delete-from-drive/index.ts)

- Add `GOOGLE_CLIENT_ID`,`GOOGLE_CLIENT_SECRET` and `GOOGLE_REFRESH_TOKEN` edge function secret.

### Installation (Netlify)

1. Import the repo to your GitHub account

2. Get a free live gold price API key at [https://metalpriceapi.com/](https://metalpriceapi.com/).

3. Login/Signin into Netlify

4. Import Github Project by
  New Project>Import an existing project>GitHub

5. Authorize Netlify > Select the imported repo.

6. In "Configure project and deploy tab"
  - Enter project name
  - Add Enviromental Variables

  |Key|Value|
  |---|---|
  |VITE_SUPABASE_DATABASE_URL|{your supabase url}|
  |VITE_SUPABASE_ANON_KEY|{your supabase key}|
  |VITE_GOLD_API_KEY|{your metalpriceapi key}|

OR instead of adding Supabase Environmental Variable you can integrate youre Supabase account afterwards from extention tab.

7. Your project should automatically be build and deploy.

### Installation (Hostinger)

1. Import the repo to your GitHub account

2. Get a free live gold price API key at [https://metalpriceapi.com/](https://metalpriceapi.com/).

3. Login/Signin into Hostinger

4. Go to Website>Website List>Add Website>Custom PHP/HTML website

3. Choose a domain or subdomain or use temporary domain.

5. In the dashboard of that website 
Go to Files>FTP Account

6. Record
7. 
| Name | Given Formate | Desired Format | Notes |
|---|---|---|---|
| FTP IP(Hostname) | "ftp://XX.XXX.XXX.XXX" | "XX.XXX.XXX.XXX" | Remove "ftp://" |
|FTP username|"uXXXXXXXXX.{your_domain}"|"uXXXXXXXXX"|Remove "{your_domain}"|
|FTP password|{your_password}|{your_password}|Use "Change FTP Password" if you don't know|

7. In your Github repo add given Repository secrets in 
  Setting>Security>Secrets and variables>Actions>

  |Name|Secret|
  |---|---|
  |FTP_HOST|{FTP IP}|
  |FTP_PASSWORD|{FTP password}|
  |FTP_USERNAME|{FTP username}|
  |VITE_SUPABASE_ANON_KEY|{your supabase key}|
  |VITE_SUPABASE_DATABASE_URL|{your supabase url}|
  |VITE_GOLD_API_KEY|{your metalpriceapi key}|

9. Now build and deploy the website by 
  Action>Deploy to Hostinger via FTP>"Open most recent workflow run">Re-run all jobs
  (See if all the steps are sucessfully perfomed in Summary>build-and-deploy)
10. *If even after a sucessful "build-and-deploy" the website doesn't work then delet "public_html" folder in Hostinger>Website>Dashboard>Files>File Manager>Access files of {your domain name} and re-run the workflow.

### Installation (To run locally)

1. Clone the repo

```
git clone https://github.com/Violet4Cheetha/KhushiiWithDiamonds.git
```

2. Change git remote url to avoid accidental pushes to base project

```
git remote set-url https://github.com/Violet4Cheetha/KhushiiWithDiamonds
git remote -v # confirm the changes
```

3. Install NPM packages

```
npm install
```

4. Get a free live gold price API key at [https://metalpriceapi.com/](https://metalpriceapi.com/).

5. Create .env and enter your Enviromental Variables in .env

```
VITE_SUPABASE_DATABASE_URL={your supabase url}
VITE_SUPABASE_ANON_KEY={your supabase key}
VITE_GOLD_API_KEY={your metalpriceapi key}
```

6. Built Vite project

```
npm run build
```





    
[google-img]: https://img.shields.io/badge/Google-4285F4?style=for-the-badge&logo=google&logoColor=white
[google-url]: https://www.google.com/

[netlify-img]: https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white
[netlify-url]: https://www.netlify.com/

[hostinger-img]: https://img.shields.io/badge/Hostinger-673DE6?style=for-the-badge&logo=hostinger&logoColor=white
[hostinger-url]: https://www.hostinger.com/

[tailwind-img]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[tailwind-url]: https://tailwindcss.com/

[reacthooks-img]: https://img.shields.io/badge/React_Hooks-61DAFB?style=for-the-badge&logo=react&logoColor=black
[reacthooks-url]: https://reactjs.org/docs/hooks-intro.html

[supabase-img]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[supabase-url]: https://supabase.com/

[lucide-img]: https://img.shields.io/badge/Lucide_React-000000?style=for-the-badge&logo=lucide&logoColor=white
[lucide-url]: https://lucide.dev/

[html-img]: https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[html-url]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5

[ts-img]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org/

[vite-img]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[vite-url]: https://vitejs.dev/

[node-img]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org/

[gha-img]: https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white
[gha-url]: https://github.com/features/actions

