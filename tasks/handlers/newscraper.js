'use strict'
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const Mercury = require("@postlight/mercury-parser");


async function worker({FBSA, NEWSAPI_KEY} = process.env){
  const serviceAccount = JSON.parse(FBSA);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://newscraper-21f8a.firebaseio.com"
  })
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
      })
      .catch(r=>console.log(r));

    articles.length += articles[sources[i]].length;

    database.ref(`/news/length`).set(articles.length)
    .then(snap=>{
      console.log(articles.length, ' total so far.');
    })
    .catch(r=>console.log(r));
  }

}

module.exports = {
  name: "newscraper-worker",
  schedule: "15 6 * * *",
  handler: worker
}
