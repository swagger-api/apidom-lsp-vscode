
import {Element} from "minim";
import {LinterFunctions} from "@swagger-api/apidom-ls";
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
    }
};

}
