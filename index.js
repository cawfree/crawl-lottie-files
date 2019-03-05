const axios = require('axios');
const cheerio = require('cheerio');

const normalize = require('./normalize');
const {
  lottieFilesUrl,
  queryModes,
} = require('./config.json');

const parseAnchors = ($, anchors) => {
  return anchors
    .reduce(
      (obj, anchor, index) => {
        if (index === 0) {
          return ({
            ...obj,
            ...anchor.attribs,
            ...normalize(
                $(
                  'lottie',
                  anchor,
                )
              )[0]
                .attribs,
          });
        } else if (index === 1) {
          const authorImage = anchor.children[0].attribs.src;
          return ({
            ...obj,
            authorImage,
          });
        } else if (index === 2) {
         const author = anchor
           .children[0]
             .children[0]
             .data;
         return ({
            ...obj,
            author,
          });
        }
        return obj;
      },
      {},
    );
};

const toFriendlyResult = ({ title, speed, bg, href, path, author, authorImage }) => ({
  title,
  url: href,
  anim: {
    uri: path,
    speed,
    backgroundColor: bg,
  },
  author: {
    name: author,
    image: authorImage,
  },
});

const parseBoxes = ($, boxes) => {
  return boxes.reduce(
    (arr, box) => {
      return ([
        ...arr,
        parseAnchors(
          $,
          normalize(
            $('a', box),
          ),
        ),
      ]);
    },
    [],
  )
  .map(toFriendlyResult);
};

class Crawler {
  authenticate() {
    return axios({
      method: 'get',
      url: `${lottieFilesUrl}`,
    })
      .then(({ headers, data }) => this.__extractSession(
        headers,
        data,
      ))
      .then(({ token, cookies }) => {
        this.__setToken(token);
        this.__setCookies(cookies);
      })
      .then(() => this);
  }
  __extractSession(headers, data) {
    const $ = cheerio
      .load(data);
    return ({
      token: normalize($('input'))
      .reduce(
        (token, element) => {
          const {
            name,
            value,
          } = (element.attribs || {});
          return token || ((name === '_token') && value);
        },
        null,
      ),
      cookies: headers['set-cookie'].reduce(
        (str, cookie) => {
          return `${str}${cookie};`;
        },
        '',
      ),
    });
  }
  __setToken(token) {
    this.token = token;
  }
  __setCookies(cookies) {
    this.cookies = cookies;
  }
  __constructRequestHeaders(cookies) {
    return ({
      cookie: cookies,
    });
  }
  __constructRequestUrl(mode, paging, page, query) {
    return `${lottieFilesUrl}/${mode}${!paging ? '' : `?page=${page || 1}`}${mode === 'search' && query ? `&query=${query}` : ''}`;
  }
  crawl(
    mode = 'recent',
    options = {},
  ) {
    return Promise.resolve()
      .then(() => {
        if (Object.keys(queryModes).indexOf(mode) < 0) {
           return Promise.reject(
            new Error(
              `Unrecognized query mode! Please select one of ${queryModes}.`,
            ),
          );
        }
        const {
          paging,
          method,
        } = queryModes[mode];
        return axios({
          method: method || 'get',
          url: this.__constructRequestUrl(
            mode,
            paging,
            options.page,
            options.query,
          ),
          data: ({
            _token: this.token,
            query: options.query,
          }),
          headers: this.__constructRequestHeaders(
            this.cookies,
          ),
          withCredentials: true,
        })
          .then(({ headers, data }) => {
            const {
              cookies,
              token,
            } = this.__extractSession(
              headers,
              data,
            );
            return ({
              headers,
              data,
            });
          })
          .then(({ headers, data }) => {
            const $ = cheerio
              .load(data);
            const result = parseBoxes(
              $,
              normalize(
                $('.lf-box'),
              ),
            );
            return Promise.resolve(
              result,
            );
          });
      });
  }
}

module.exports = Crawler;
