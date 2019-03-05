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

// XXX: Coerce cheerio towards standard
//      array conventions.
const normalize = (selection) => {
  const arr = [];
  selection.each(
    (index, element) => arr.push(element),
  );
  return arr;
};

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

const auth = () => axios({
  method: 'get',
  url: `${URL}`,
})
  .then(({ headers, data }) => {
    const $ = cheerio
      .load(data);
    console.log(headers);
    const _token  = normalize($('input'))
      .reduce(
        (token, element) => {
          const {
            name,
            value,
            _token,
          } = (element.attribs || {});
          return token || ((name === '_token') && value);
          console.log(JSON.stringify(element.attribs));
          return token || _token;
        },
        null,
      );
    console.log(_token);
    const cookies = headers['set-cookie'];
    console.log(cookies);
    return ({
      _token,
      cookies,
    });
  });

//auth();

export const crawl = (
  mode, // recent, search, popular, featured
  page, // which page of results to return 
  options,
) => Promise.resolve()
  .then(() => auth())
  .then(({ _token, cookies }) => {
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
    const resolvedOptions = (options || {});
    const requestUrl = `${URL}/${mode}${pagingDisabled ? '' : `?page=${page || 1}`}`;
    const requestMethod = method || 'get';
    const requestData = ({
      _token,
      ...((!!data && data(resolvedOptions))) || {},
    });
    return axios({
      method: requestMethod,
      url: requestUrl,
      data: ({
        _token,
        ...requestData,
      }),
      headers: {
        'content-uype': 'application/x-www-form-urlencoded',
        'user-agent': 'Mozilla/5.0 (X11; CrOS x86_64 11316.148.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.117 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8,fr;q=0.7',
        'dnt': 1,
        'origin': 'https://lottiefiles.com',
        'referer': 'https://lottiefiles.com/search',
        'upgrade-insecure-requests': 1,
        'cache-control': 'max-age=0',
        'content-length': 59,
        'cookie': cookies.reduce(
          (str, cookie) => {
            return `${str}${cookie};`;
          },
          '',
        ),
      },
      withCredentials: true,
    })
      .then(({ data }) => {
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

crawl(
  'search',
  null,
  {
    query: 'hello',
  },
);
