const axios = require('axios');
const cheerio = require('cheerio');

//// XXX: Coerce cheerio towards standard
////      array conventions.
const normalize = (selection) => {
  const arr = [];
  selection.each(
    (index, element) => arr.push(element),
  );
  return arr;
};

export const lottieUrl = 'https://lottiefiles.com';

export const queryModes = ({
  popular: {},
  featured: {},
  recent: {
    paging: true,
  },
  search: {
    paging: true,
    method: 'post',
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

class Crawler {
  authenticate() {
    return axios({
      method: 'get',
      url: `${lottieUrl}`,
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
      cookie: cookies,
    });
  }
  __constructRequestUrl(mode, paging, page, query) {
    return `${lottieUrl}/${mode}${!paging ? '' : `?page=${page || 1}`}${mode === 'search' && query ? `&query=${query}` : ''}`;
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
            console.log(result);
            return Promise.resolve(
              result,
            );
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
//  .then(() => {
//    console.log('now number 2...');
//    return new Promise(resolve => setTimeout(resolve, 5000));
//  })
//  .then(() => c.crawl(
//    'recent',
//    {
//      query: 'hello',
//      page: 2,
//    },
//  ));

export default Crawler;
