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
    'featured',
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
The response object is a JSON array whose elements are the content-agnostic merger of unique HTML attributes used to present the Lottie Animation. This is constructed using a recursive algorithm which _tries_ to traverse the DOM tree to find relevant information about the file to support artist attribution. This approach aims to provide, at the very least, the raw asset required to initialize a Lottie Animation. 
```
[{
  "href":"/qin",
  "title":"Loading",
  "class":"block rounded-t-lg border-b border-grey-lighter pt-1 pb-0 relative",
  "style":"background-color:#000000",
  "text":"Qin",
  "src":"https://assets8.lottiefiles.com/avatars/100_18783-65967054.jpg",
  "alt":"\"\"",
  "height":"270",
  "type":"public",
  "path":"https://assets3.lottiefiles.com/temp/lf20_NjaR5i.json",
  "id":"4434",
  "speed":"1",
  "bg":"#000000",
  "is-listing":"true"
}]
```

Since any changes on the frontend can disrupt data collection, this implementation serves to be the most resistant to change; however future frontend changes have the potential to interfere with any of the following keys:
```
["href", "title", "class", "style", "text", "src", "alt"]
```
> **NOTE:** `crawl-lottie-files` is heavily dependent on a known structure of the LottieFiles DOM. Whenever the frontend changes, this tool will need to be updated.

## 😍 Usage
LottieFiles is an _awesome_ utility that benefits everybody, so we should treat it with respect. It is vital that this tool is used **responsibly**.

You **must not**:
  - Misrepresent the host of the files.
  - Query at speeds which exceed a manual browsing session.

You **must**:
  - Ensure the artists are credited.
  - Do your best to promote Lottie as much as you can!

## 🎁 Credits
`crawl-lottie-files` was made possible by [`axios`](https://github.com/axios/axios) and [`node-html-parser`](https://github.com/taoqf/node-html-parser). An extra special thank you to the [Lottie Animations Team](https://airbnb.io/lottie/) at [AirBnB](https://www.airbnb.co.uk) for their revolutionary and open approach towards enriching user experience.

## ⛱ License
[MIT](/LICENSE.md)
