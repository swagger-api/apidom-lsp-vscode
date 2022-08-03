(element) => {
  if (element && (0, _apidom.isStringElement)(element)) {
    const re = /"/gi;

    if (!String(element.toValue()).replace(re, '').match(/^2\.0.*$/)) {
      return false;
    }
  }

  return true;
}

