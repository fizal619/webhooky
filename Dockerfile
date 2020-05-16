FROM arm32v7/node:12-alpine
RUN apk --no-cache --virtual build-dependencies add python make g++ git
ENV NODE_ENV production

WORKDIR /app
COPY . /app

RUN npm install

CMD ["npm", "start"]