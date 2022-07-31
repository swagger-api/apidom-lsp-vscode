const apidom_ls = require("@swagger-api/apidom-ls");

(element) => {
  if (element && apidom_ls.isObjectElement(element) && element.element === 'contact') {
    if (!element.get('x-acme-team')) {
      return false;
    }
  }
  return true;
}
