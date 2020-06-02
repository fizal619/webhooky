'use strict'
const fetch = require('node-fetch');
const Mercury = require("@postlight/mercury-parser");

async function worker({FBSA, NEWSAPI_KEY} = process.env){
  const admin = require('firebase-admin');
  const serviceAccount = JSON.parse(FBSA);
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://newscraper-21f8a.firebaseio.com"
  });
  const database = admin.database();

  //fetch sources in a promise
  const fetchSources = () => new Promise(resolve => {
    fetch(`https://newsapi.org/v2/sources?country=us&language=en&apiKey=${NEWSAPI_KEY}`)
    .then(r=>r.json())
    .then(data=>resolve(data.sources.map(source=> source.id)));
  });

  const fetchHeadlines = source => new Promise(resolve => {
    fetch(`https://newsapi.org/v2/top-headlines?pageSize=10&sources=${source}&apiKey=${NEWSAPI_KEY}`)
    .then(r=>r.json())
    .then(data=>resolve(data.articles));
  });

  const scrapeContent = async article => {
    try {
      const scrapedContent = await Mercury.parse(article.url);
      console.log("GOT", article.title);
      // console.log(scrapedContent);
      if (article.title.includes("CNN Video")) {
        return article;
      }

      return {
        ...article,
        content: scrapedContent.content,
        excerpt: scrapedContent.excerpt
      }
    } catch (e) {
      return article;
    }
  }

  let sources = await fetchSources();
  console.log('SOURCES', sources.length);
  let articles = {
    length: 0
  };
  console.log('Working on it...');

  for(let i=0; i < sources.length; i++) {
    console.log('trying', sources[i]);
    let tempArticles = await fetchHeadlines(sources[i]);
    console.log(tempArticles.length);
    if(!tempArticles) continue;

    console.log('scraping...');
    let scrapedArticles = [];
    for(let j=0; j < tempArticles.length; j++) {
      let tempArticle = tempArticles[j];
      tempArticle = await scrapeContent(tempArticle);
      if (tempArticle['content']) {
         scrapedArticles.push(JSON.stringify(tempArticle));
      }
    }
    articles[sources[i]] = scrapedArticles;
    database.ref(`/news/${sources[i]}`).set(scrapedArticles)
      .then(snap=>{
        console.log(scrapedArticles.length, ' items set! for', sources[i]);
        articles.length += articles[sources[i]].length;
        database.ref(`/news/length`).set(articles.length)
        .then(snap=>{
          console.log(articles.length, ' total so far.');
          if (i+1 === sources.length) {
            //this should be the end of scraping
            app.delete().then(()=>{
              console.log("signed out of app.");
            });
          }
        })
        .catch(r=>console.log(r));
      })
      .catch(r=>console.log(r));
  }

}

module.exports = {
  name: "newscraper-worker",
  schedule: "1 6,15 * * *",
  handler: worker
}
