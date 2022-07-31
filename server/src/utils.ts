import fs from 'fs';
import path from "path";
import {
    isArrayElement, isBooleanElement,
    isMemberElement, isNumberElement,
    isObjectElement,
    isStringElement, LinterFunctions,
} from '@swagger-api/apidom-ls';

import {ArrayElement, BooleanElement, Element, MemberElement, NumberElement, ObjectElement, StringElement} from "minim";

export const isObject = (element: Element): element is ObjectElement => {
    return isObjectElement(element);
};
export const isMember = (element: Element): element is MemberElement => {
    return isMemberElement(element);
};
export const isArray = (element: Element): element is ArrayElement => {
    return isArrayElement(element);
};

export const isString = (element: Element): element is StringElement => {
    return isStringElement(element);
};

export const isNumber = (element: Element): element is NumberElement => {
    return isNumberElement(element);
};

export const isBoolean = (element: Element): element is BooleanElement => {
    return isBooleanElement(element);
};

export function loadFunctions(dir: string): LinterFunctions {
    const linterFunctions: LinterFunctions = {};
    const dirContent = fs.readdirSync(dir);

    dirContent.forEach((file) => {
        const funcName = file.split('.')[0];
        if (!file.endsWith('~')) {
            try {
                // eslint-disable-next-line no-eval,no-param-reassign
                linterFunctions[funcName] = eval(fs.readFileSync(path.join(dir, String(file))).toString());
            } catch (e) {
                console.log('error eval', e);
            }
        }
    });

    return linterFunctions;
}