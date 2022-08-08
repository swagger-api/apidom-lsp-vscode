import {Element} from "minim";
import apidom_ls, {LinterFunctions} from "@swagger-api/apidom-ls";
import {isObject, isMember, isArray, isBoolean, isNumber, isString} from "./utils";

export function functions(): LinterFunctions {
return {
    "requiredAcmeExtension" : (element: Element): boolean => {
        if (element && isObject(element)) {
            if (!element.get('x-acme-version')) {
                return false;
            }
        }
        return true;
    },
  "requiredAcmeTeam": (element) => {
    if (element && apidom_ls.isObjectElement(element) && element.element === 'contact') {
      if (!element.get('x-acme-team')) {
        return false;
      }
    }
    return true;
  }
};

}
