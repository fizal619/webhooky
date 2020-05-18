FROM arm32v7/node:12-alpine
RUN apk --no-cache --virtual build-dependencies add python make g++ git
ENV NODE_ENV production

WORKDIR /app

COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
RUN npm install

COPY . /app

CMD ["npm", "start"]