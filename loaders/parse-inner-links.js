/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

module.exports = function (html) {
  const headerRegexp = /<h2>(.*)<\/h2>/g;
  const headerMatches = [];
  let result;

  // find all links
  while ((result = headerRegexp.exec(html)) !== null) {
    headerMatches.push(result);
  }

  headerMatches.forEach((match, index) => {
    const innerText = match[1];
    const anchorStr = `<h2>${innerText}<\/h2>`;

    if (html.indexOf(anchorStr) > -1) {
      // set hash as id for anchor header
      html = html.replace(anchorStr,
        `<h2 id="${index}-id">${innerText}<\/h2>`);
    }
  });

  return html;
};
