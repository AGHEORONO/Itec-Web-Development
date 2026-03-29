# Baza imaginii Docker (Versiune optimizata Alpine)
FROM node:20-alpine

# Seteaza mediul standard de lucru in interiorul ecosistemului
WORKDIR /app

# Copiaza retetarul proiectului pentru a instalarea fisierelor (Layer de cache)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copiaza the whole source-code iTECify 
COPY . .

# Construieste versiunea rapida si comprimata a site-ului NextJS (pentru Productie)
RUN npm run build

# Expune The Editor Network (Portul standard 3000)
EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

# Regula finala de start, se evita npm run dev datorita cerintei stricte de memorie a Hackathonurilor
CMD ["npm", "run", "start"]
