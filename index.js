const axios = require('axios');
const { parse } = require('node-html-parser');

const {
  lottieFilesUrl,
  queryModes,
} = require('./config.json');

function recursiveCollect(
  parentNode,
  prune,
  depthNodes = [],
) {
  return (parentNode.childNodes || []).reduce(
    (arr, child) => {
      const depth = ([
        ...depthNodes,
        parentNode,
      ]);
      return ([
        ...arr,
        ...recursiveCollect(
          child,
          prune,
          depth,
        ),
      ]);
    },
    // XXX: Here we're uninterested in nodes without tag names.
    (!prune(depthNodes, parentNode)) ? [parentNode] : [],
  );
};

const scrape = ($) => {
  return $.querySelectorAll('lottie')
    .reduce(
      (arr, lottie) => {
        const result = recursiveCollect(
          // TODO: This could likely become a function to decide to which
          //       level we'd like to start the search.
          lottie
            .parentNode
              .parentNode,
          // XXX: Use a pruning function to avoid accumulating
          //      children we're not interested in.
          (depth, child) => {
            const {
              tagName,
            } = child;
            // We're not interested in nodes without tagNames.
            return !tagName || !(tagName === 'a' || tagName === 'img');
          },
        )
          .reduce(
            (obj, node) => {
              const {
                tagName,
                attributes,
              } = node;
              if (tagName === 'img') {
                return ({
                  ...obj,
                  ...attributes,
                });
              } else if (tagName === 'a') {
                if (attributes.href && attributes.href.length > 0 && attributes.href !== '""') {
                  const { text } = node;
                  return ({
                    ...obj,
                    ...attributes,
                    text,
                  });
                }
              }
              return obj;
            },
            {},
          );
        return ([
          ...arr,
          {
            ...result,
            ...lottie.attributes,
          },
        ]);
      },
      [],
    );
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
    const $ = parse(data);
    return ({
      token: $.querySelectorAll('input')
      .reduce(
        (token, element) => {
          const {
            name,
            value,
          } = (element.attributes || {});
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
            const $ = parse(data);
            const result = scrape($);
            return Promise.resolve(
              result,
            );
          });
      });
  }
}

module.exports = Crawler
