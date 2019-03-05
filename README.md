# crawl-lottie-files
A Promise-based utility which scrapes and parses the contents of [LottieFiles](https://lottiefiles.com) HTML pages to retrieve asset information.

## 🚀 Installing
Using `npm`:
```
npm install crawl-lottie-files
```
Using `yarn`:

```
yarn add crawl-lottie-files
```

## 📚 Example

Returning the list of `featured` Lottie Animations:

```
import LottieCrawler from 'crawl-lottie-files';

new LottieCrawler()
  .authenticate()
  .then((crawler) => crawler.crawl(
    'recent',
  ))
  .then((featuredAnimations) => {
    // ...
  })
  .catch(console.error);

```
Perfoming a paginated `search`:

```
import LottieCrawler from 'crawl-lottie-files';

new LottieCrawler()
  .authenticate()
  .then((crawler) => crawler.crawl(
    'search',
    {
      query: 'loading',
      page: 3,
    },
  ))
  .then((results) => {
    // results is an array of matching animations
    // from the third page of results
  })
  .catch(console.error);

```
Perform consecutive requests:
```
import LottieCrawler from 'crawl-lottie-files';

new LottieCrawler()
  .authenticate()
  .then((crawler) => {
    return Promise.resolve()
      .then(() => crawler.crawl(
        'recent',
      ))
      .then(() => crawler.crawl(
        'popular',
      ))
      .then(() => crawler.crawl(
        'featured',
      ));
  })
  .catch(console.error);

```
## 🎉 Response
The response object is a JSON array that captures information about the `author`, rendering information in the `anim` block and general display configuration data.
```
[{
  title: 'A Guakka loader for Foodvisor 🥑',
  url: 'https://lottiefiles.com/4675-a-guakka-loader-for-foodvisor',
  anim: {
    uri: 'https://assets1.lottiefiles.com/temp/lf20_wuEIkp.json',
    speed: '1',
    backgroundColor: '#ffffff'
  },
  author:{
    name: 'Samy Menai',
    image: 'https://assets3.lottiefiles.com/avatars/100_338.jpg'
  }
}]
```
> **NOTE:** `crawl-lottie-files` is heavily dependent on a known structure of the LottieFiles DOM. Whenever the frontend changes, this tool will need to be updated.

## 😍 Usage
LottieFiles is an _awesome_ utility that benefits everybody, so we should treat it with respect. It is vital that this tool is used **responsibly**.

You **must not**:
  - Misrepresent the host of the files.
  - Query at speeds which exeed a manual browsing session.

You **must**:
  - Do your best to promote Lottie as much as you can!
  - Ensure the artists are credited.

## 🎁 Credits
`crawl-lottie-files` was made possible by [`axios`](https://github.com/axios/axios) and [`cheerio`](https://github.com/cheeriojs/cheerio). An extra special thank you to the [Lottie Animations Team](https://airbnb.io/lottie/) at [AirBnB](https://www.airbnb.co.uk) for their revolutionary and open approach towards enriching user experience.

## ⛱ License
MIT
