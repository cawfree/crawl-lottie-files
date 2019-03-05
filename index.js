// TODO: Remove this; do not be opinionated about the interface structure.
const axios = require('axios');
const cheerio = require('cheerio');

// TODO: As a prop?
export const URL = 'https://lottiefiles.com';
export const BOXES_PER_PAGE = 16;

export const QUERY_MODES = ({
  popular: {
    pagingDisabled: true,
  },
  featured: {
    pagingDisabled: true,
  },
  recent: {

  },
  search: {
    method: 'post',
    data(options) {
      const {
        query,
      } = options;
      if (!query) {
        throw new Error(
          'It is illegal to search without specifying a query!',
        );
      }
      return ({
        query,
      });
    },
  },
});

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
        }
        return obj;
      },
      {},
    );
};

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
  );
};

//// XXX: Coerce cheerio towards standard
////      array conventions.
const normalize = (selection) => {
  const arr = [];
  selection.each(
    (index, element) => arr.push(element),
  );
  return arr;
};

class Crawler {
  authenticate() {
    return axios({
      method: 'get',
      url: `${URL}`,
    })
      .then(({ headers, data }) => this.__extractSession(
        headers,
        data,
      ))
      .then(({ token, cookies }) => {
        this.__setToken(token);
        this.__setCookies(cookies);
      });
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
      'content-uype': 'application/x-www-form-urlencoded',
      'user-agent': 'Mozilla/5.0 (X11; CrOS x86_64 11316.148.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.117 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8,fr;q=0.7',
      'dnt': 1,
      'origin': 'https://lottiefiles.com',
      'upgrade-insecure-requests': 1,
      'cache-control': 'max-age=0',
      'cookie': cookies,
    });
  }
  crawl(
    mode = 'recent',
    options = {},
  ) {
    return Promise.resolve()
      .then(() => {
        if (Object.keys(QUERY_MODES).indexOf(mode) < 0) {
           return Promise.reject(
            new Error(
              `Unrecognized query mode! Please select one of ${QUERY_MODES}.`,
            ),
          );
        }
        const {
          pagingDisabled,
          method,
          data,
        } = QUERY_MODES[mode];
        return axios({
          method: method || 'get',
          url: `${URL}/${mode}${pagingDisabled ? '' : `?page=${options.page || 1}`}${mode === 'search' && options.query ? `&query=${options.query}` : ''}`,
          data: ({
            _token: this.token,
            ...({
              ...((!!data && data(options))) || {},
            }),
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
            console.log('on result got cookies as '+cookies);
            console.log('on result got token as '+token);
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
            console.log(result);
          });
      });
  }
}

const c = new Crawler();

c.authenticate()
  .then(() => c.crawl(
    'search',
    {
      query: 'hello',
      page: 1,
    },
  ))
  .then(() => {
    console.log('now number 2...');
    return new Promise(resolve => setTimeout(resolve, 5000));
  })
  .then(() => c.crawl(
    'search',
    {
      query: 'hello',
      page: 2,
    },
  ))
