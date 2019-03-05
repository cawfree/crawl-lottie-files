//// XXX: Coerce cheerio towards standard
////      array conventions.
const normalize = (selection) => {
  const arr = [];
  selection.each(
    (index, element) => arr.push(element),
  );
  return arr;
};

module.exports = normalize;
