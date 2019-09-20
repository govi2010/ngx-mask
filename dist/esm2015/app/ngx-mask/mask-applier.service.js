import * as tslib_1 from "tslib";
import { Inject, Injectable } from '@angular/core';
import { config } from './config';
export var Separators;
(function (Separators) {
    Separators["SEPARATOR"] = "separator";
    Separators["COMMA_SEPARATOR"] = "comma_separator";
    Separators["DOT_SEPARATOR"] = "dot_separator";
    Separators["IND_COMMA_SEPARATED"] = "ind_comma_separated";
    Separators["INT_COMMA_SEPARATED"] = "int_comma_separated";
    Separators["INT_SPACE_SEPARATED"] = "int_space_separated";
    Separators["INT_APOSTROPHE_SEPARATED"] = "int_apostrophe_separated";
})(Separators || (Separators = {}));
let MaskApplierService = class MaskApplierService {
    constructor(_config) {
        this._config = _config;
        this.maskExpression = '';
        this.actualValue = '';
        this.shownMaskExpression = '';
        this.separator = (str, char, decimalChar, precision) => {
            str += '';
            const x = str.split(decimalChar);
            const decimals = x.length > 1 ? `${decimalChar}${x[1]}` : '';
            let res = x[0];
            const rgx = /(\d+)(\d{3})/;
            while (rgx.test(res)) {
                res = res.replace(rgx, '$1' + char + '$2');
            }
            if (precision === undefined) {
                return res + decimals;
            }
            else if (precision === 0) {
                return res;
            }
            return res + decimals.substr(0, precision + 1);
        };
        this.currencySeparator = (str, char, decimalChar, precision, indFormat = false) => {
            str += '';
            const x = str.split(decimalChar);
            const decimals = x.length > 1 ? `${decimalChar}${x[1]}` : '';
            const baseNum = x[0];
            let lastThree = baseNum.substring(baseNum.length - 3);
            const otherNumbers = baseNum.substring(0, baseNum.length - 3);
            if (otherNumbers !== '') {
                lastThree = char + lastThree;
            }
            const res = (indFormat ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, char) :
                otherNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, char)) + lastThree;
            if (precision === undefined) {
                return res + decimals;
            }
            else if (precision === 0) {
                return res;
            }
            return res + decimals.substr(0, precision + 1);
        };
        this.percentage = (str) => {
            return Number(str) >= 0 && Number(str) <= 100;
        };
        this.getPrecision = (maskExpression) => {
            const x = maskExpression.split('.');
            if (x.length > 1) {
                return Number(x[x.length - 1]);
            }
            return Infinity;
        };
        this.checkInputPrecision = (inputValue, precision, decimalMarker) => {
            if (precision < Infinity) {
                let precisionRegEx;
                if (decimalMarker === '.') {
                    precisionRegEx = new RegExp(`\\.\\d{${precision}}.*$`);
                }
                else {
                    precisionRegEx = new RegExp(`,\\d{${precision}}.*$`);
                }
                const precisionMatch = inputValue.match(precisionRegEx);
                if (precisionMatch && precisionMatch[0].length - 1 > precision) {
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
                else if (precision === 0 && inputValue.endsWith(decimalMarker)) {
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
            }
            return inputValue;
        };
        this._shift = new Set();
        this.clearIfNotMatch = this._config.clearIfNotMatch;
        this.dropSpecialCharacters = this._config.dropSpecialCharacters;
        this.maskSpecialCharacters = this._config.specialCharacters;
        this.maskAvailablePatterns = this._config.patterns;
        this.prefix = this._config.prefix;
        this.suffix = this._config.suffix;
        this.hiddenInput = this._config.hiddenInput;
        this.showMaskTyped = this._config.showMaskTyped;
        this.validation = this._config.validation;
    }
    // tslint:disable-next-line:no-any
    applyMaskWithPattern(inputValue, maskAndPattern) {
        const [mask, customPattern] = maskAndPattern;
        this.customPattern = customPattern;
        return this.applyMask(inputValue, mask);
    }
    applyMask(inputValue, maskExpression, position = 0, cb = () => {
    }) {
        if (inputValue === undefined || inputValue === null || maskExpression === undefined) {
            return '';
        }
        let cursor = 0;
        let result = ``;
        let multi = false;
        let backspaceShift = false;
        let shift = 1;
        let stepBack = false;
        if (inputValue.slice(0, this.prefix.length) === this.prefix) {
            inputValue = inputValue.slice(this.prefix.length, inputValue.length);
        }
        const inputArray = inputValue.toString().split('');
        if (maskExpression === 'IP') {
            this.ipError = !!(inputArray.filter((i) => i === '.').length < 3 && inputArray.length < 7);
            maskExpression = '099.099.099.099';
        }
        if (maskExpression.startsWith('percent')) {
            if (inputValue.match('[a-z]|[A-Z]') || inputValue.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,\/]/)) {
                inputValue = this._checkInput(inputValue);
                const precision = this.getPrecision(maskExpression);
                inputValue = this.checkInputPrecision(inputValue, precision, '.');
            }
            if (inputValue.indexOf('.') > 0 && !this.percentage(inputValue.substring(0, inputValue.indexOf('.')))) {
                const base = inputValue.substring(0, inputValue.indexOf('.') - 1);
                inputValue = `${base}${inputValue.substring(inputValue.indexOf('.'), inputValue.length)}`;
            }
            if (this.percentage(inputValue)) {
                result = inputValue;
            }
            else {
                result = inputValue.substring(0, inputValue.length - 1);
            }
        }
        else if (maskExpression.startsWith(Separators.SEPARATOR) ||
            maskExpression.startsWith(Separators.DOT_SEPARATOR) ||
            maskExpression.startsWith(Separators.COMMA_SEPARATOR) ||
            maskExpression.startsWith(Separators.IND_COMMA_SEPARATED) ||
            maskExpression.startsWith(Separators.INT_APOSTROPHE_SEPARATED) ||
            maskExpression.startsWith(Separators.INT_COMMA_SEPARATED) ||
            maskExpression.startsWith(Separators.INT_SPACE_SEPARATED)) {
            if (inputValue.match('[wа-яА-Я]') ||
                inputValue.match('[ЁёА-я]') ||
                inputValue.match('[a-z]|[A-Z]') ||
                inputValue.match(/[-@#!$%\\^&*()_£¬'+|~=`{}\[\]:";<>.?\/]/)) {
                inputValue = this._checkInput(inputValue);
            }
            const precision = this.getPrecision(maskExpression);
            let strForSep;
            if (maskExpression.startsWith(Separators.SEPARATOR)) {
                if (inputValue.includes(',') &&
                    inputValue.endsWith(',') &&
                    inputValue.indexOf(',') !== inputValue.lastIndexOf(',')) {
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
                inputValue = inputValue.replace('.', ' ');
            }
            if (maskExpression.startsWith(Separators.DOT_SEPARATOR)) {
                if (inputValue.indexOf('.') !== -1 &&
                    inputValue.indexOf('.') === inputValue.lastIndexOf('.') &&
                    (inputValue.indexOf('.') > 3 || inputValue.length < 6)) {
                    inputValue = inputValue.replace('.', ',');
                }
                inputValue =
                    inputValue.length > 1 && inputValue[0] === '0' && inputValue[1] !== ','
                        ? inputValue.slice(1, inputValue.length)
                        : inputValue;
            }
            if (maskExpression.startsWith(Separators.COMMA_SEPARATOR)) {
                inputValue =
                    inputValue.length > 1 && inputValue[0] === '0' && inputValue[1] !== '.'
                        ? inputValue.slice(1, inputValue.length)
                        : inputValue;
            }
            if (maskExpression.startsWith(Separators.SEPARATOR)) {
                if (inputValue.match(/[@#!$%^&*()_+|~=`{}\[\]:.";<>?\/]/)) {
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
                inputValue = this.checkInputPrecision(inputValue, precision, ',');
                strForSep = inputValue.replace(/\s/g, '');
                result = this.separator(strForSep, ' ', ',', precision);
            }
            else if (maskExpression.startsWith(Separators.DOT_SEPARATOR)) {
                if (inputValue.match(/[@#!$%^&*()_+|~=`{}\[\]:\s";<>?\/]/)) {
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
                inputValue = this.checkInputPrecision(inputValue, precision, ',');
                strForSep = inputValue.replace(/\./g, '');
                result = this.separator(strForSep, '.', ',', precision);
            }
            else if (maskExpression.startsWith(Separators.COMMA_SEPARATOR)) {
                strForSep = inputValue.replace(/,/g, '');
                result = this.separator(strForSep, ',', '.', precision);
            }
            else if (maskExpression.startsWith(Separators.IND_COMMA_SEPARATED)) {
                strForSep = inputValue.replace(/,/g, '');
                result = this.currencySeparator(strForSep, ',', '.', precision, true);
            }
            else if (maskExpression.startsWith(Separators.INT_SPACE_SEPARATED)) {
                strForSep = inputValue.replace(/[ ,']/g, '');
                result = this.currencySeparator(strForSep, ' ', '.', precision);
            }
            else if (maskExpression.startsWith(Separators.INT_COMMA_SEPARATED)) {
                strForSep = inputValue.replace(/,/g, '');
                result = this.currencySeparator(strForSep, ',', '.', precision);
            }
            else if (maskExpression.startsWith(Separators.INT_APOSTROPHE_SEPARATED)) {
                strForSep = inputValue.replace(/[ ,']/g, '');
                result = this.currencySeparator(strForSep, '\'', '.', precision);
            }
            const commaShift = result.indexOf(',') - inputValue.indexOf(',');
            const shiftStep = result.length - inputValue.length;
            // position shifting issue fixed for custom separators
            if (!(maskExpression.startsWith(Separators.IND_COMMA_SEPARATED) ||
                maskExpression.startsWith(Separators.INT_APOSTROPHE_SEPARATED) ||
                maskExpression.startsWith(Separators.INT_COMMA_SEPARATED) ||
                maskExpression.startsWith(Separators.INT_SPACE_SEPARATED))) {
                if (shiftStep > 0 && result[position] !== ',') {
                    backspaceShift = true;
                    let _shift = 0;
                    do {
                        this._shift.add(position + _shift);
                        _shift++;
                    } while (_shift < shiftStep);
                }
                else if ((commaShift !== 0 && position > 0 && !(result.indexOf(',') >= position && position > 3)) ||
                    (!(result.indexOf('.') >= position && position > 3) && shiftStep <= 0)) {
                    this._shift.clear();
                    backspaceShift = true;
                    shift = shiftStep;
                    position += shiftStep;
                    this._shift.add(position);
                }
                else {
                    this._shift.clear();
                }
            }
        }
        else {
            for (
            // tslint:disable-next-line
            let i = 0, inputSymbol = inputArray[0]; i < inputArray.length; i++, inputSymbol = inputArray[i]) {
                if (cursor === maskExpression.length) {
                    break;
                }
                if (this._checkSymbolMask(inputSymbol, maskExpression[cursor]) && maskExpression[cursor + 1] === '?') {
                    result += inputSymbol;
                    cursor += 2;
                }
                else if (maskExpression[cursor + 1] === '*' &&
                    multi &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])) {
                    result += inputSymbol;
                    cursor += 3;
                    multi = false;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor]) &&
                    maskExpression[cursor + 1] === '*') {
                    result += inputSymbol;
                    multi = true;
                }
                else if (maskExpression[cursor + 1] === '?' &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])) {
                    result += inputSymbol;
                    cursor += 3;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor]) ||
                    (this.hiddenInput &&
                        this.maskAvailablePatterns[maskExpression[cursor]] &&
                        this.maskAvailablePatterns[maskExpression[cursor]].symbol === inputSymbol)) {
                    if (maskExpression[cursor] === 'H') {
                        if (Number(inputSymbol) > 2) {
                            cursor += 1;
                            const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor))
                                ? inputArray.length
                                : cursor;
                            this._shift.add(shiftStep + this.prefix.length || 0);
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'h') {
                        if (result === '2' && Number(inputSymbol) > 3) {
                            cursor += 1;
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'm') {
                        if (Number(inputSymbol) > 5) {
                            cursor += 1;
                            const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor))
                                ? inputArray.length
                                : cursor;
                            this._shift.add(shiftStep + this.prefix.length || 0);
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 's') {
                        if (Number(inputSymbol) > 5) {
                            cursor += 1;
                            const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor))
                                ? inputArray.length
                                : cursor;
                            this._shift.add(shiftStep + this.prefix.length || 0);
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor - 1] === 'd') {
                        if (Number(inputValue.slice(cursor - 1, cursor + 1)) > 31 || inputValue[cursor] === '/') {
                            cursor += 1;
                            const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor))
                                ? inputArray.length
                                : cursor;
                            this._shift.add(shiftStep + this.prefix.length || 0);
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'M') {
                        if ((inputValue[cursor - 1] === '/' &&
                            (Number(inputValue.slice(cursor, cursor + 2)) > 12 ||
                                inputValue[cursor + 1] === '/')) ||
                            (Number(inputValue.slice(cursor - 1, cursor + 1)) > 12 ||
                                Number(inputValue.slice(0, 2)) > 31 ||
                                (Number(inputValue[cursor - 1]) > 1 && inputValue[cursor - 2] === '/'))) {
                            cursor += 1;
                            const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor))
                                ? inputArray.length
                                : cursor;
                            this._shift.add(shiftStep + this.prefix.length || 0);
                            i--;
                            continue;
                        }
                    }
                    result += inputSymbol;
                    cursor++;
                }
                else if (this.maskSpecialCharacters.indexOf(maskExpression[cursor]) !== -1) {
                    result += maskExpression[cursor];
                    cursor++;
                    const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor))
                        ? inputArray.length
                        : cursor;
                    this._shift.add(shiftStep + this.prefix.length || 0);
                    i--;
                }
                else if (this.maskSpecialCharacters.indexOf(inputSymbol) > -1 &&
                    this.maskAvailablePatterns[maskExpression[cursor]] &&
                    this.maskAvailablePatterns[maskExpression[cursor]].optional) {
                    cursor++;
                    i--;
                }
                else if (this.maskExpression[cursor + 1] === '*' &&
                    this._findSpecialChar(this.maskExpression[cursor + 2]) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.maskExpression[cursor + 1] === '?' &&
                    this._findSpecialChar(this.maskExpression[cursor + 2]) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.showMaskTyped &&
                    this.maskSpecialCharacters.indexOf(inputSymbol) < 0 &&
                    inputSymbol !== '_') {
                    stepBack = true;
                }
            }
        }
        if (result.length + 1 === maskExpression.length &&
            this.maskSpecialCharacters.indexOf(maskExpression[maskExpression.length - 1]) !== -1) {
            result += maskExpression[maskExpression.length - 1];
        }
        let newPosition = position + 1;
        while (this._shift.has(newPosition)) {
            shift++;
            newPosition++;
        }
        let actualShift = this._shift.has(position) ? shift : 0;
        if (stepBack) {
            actualShift--;
        }
        cb(actualShift, backspaceShift);
        if (shift < 0) {
            this._shift.clear();
        }
        let res = this.suffix ? `${this.prefix}${result}${this.suffix}` : `${this.prefix}${result}`;
        if (result.length === 0) {
            res = `${this.prefix}${result}`;
        }
        return res;
    }
    _findSpecialChar(inputSymbol) {
        return this.maskSpecialCharacters.find((val) => val === inputSymbol);
    }
    _checkSymbolMask(inputSymbol, maskSymbol) {
        this.maskAvailablePatterns = this.customPattern ? this.customPattern : this.maskAvailablePatterns;
        return (this.maskAvailablePatterns[maskSymbol] &&
            this.maskAvailablePatterns[maskSymbol].pattern &&
            this.maskAvailablePatterns[maskSymbol].pattern.test(inputSymbol));
    }
    _checkInput(str) {
        return str
            .split('')
            .filter((i) => i.match('\\d') || i === '.' || i === ',')
            .join('');
    }
};
MaskApplierService.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [config,] }] }
];
MaskApplierService = tslib_1.__decorate([
    Injectable(),
    tslib_1.__param(0, Inject(config)),
    tslib_1.__metadata("design:paramtypes", [Object])
], MaskApplierService);
export { MaskApplierService };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzay1hcHBsaWVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtbWFzay8iLCJzb3VyY2VzIjpbImFwcC9uZ3gtbWFzay9tYXNrLWFwcGxpZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbkQsT0FBTyxFQUFFLE1BQU0sRUFBVyxNQUFNLFVBQVUsQ0FBQztBQUUzQyxNQUFNLENBQU4sSUFBWSxVQVFYO0FBUkQsV0FBWSxVQUFVO0lBQ3BCLHFDQUF1QixDQUFBO0lBQ3ZCLGlEQUFtQyxDQUFBO0lBQ25DLDZDQUErQixDQUFBO0lBQy9CLHlEQUEyQyxDQUFBO0lBQzNDLHlEQUEyQyxDQUFBO0lBQzNDLHlEQUEyQyxDQUFBO0lBQzNDLG1FQUFxRCxDQUFBO0FBQ3ZELENBQUMsRUFSVyxVQUFVLEtBQVYsVUFBVSxRQVFyQjtBQUdELElBQWEsa0JBQWtCLEdBQS9CLE1BQWEsa0JBQWtCO0lBbUI3QixZQUE2QyxPQUFnQjtRQUFoQixZQUFPLEdBQVAsT0FBTyxDQUFTO1FBZHRELG1CQUFjLEdBQVcsRUFBRSxDQUFDO1FBQzVCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1FBQ3pCLHdCQUFtQixHQUFXLEVBQUUsQ0FBQztRQXFYaEMsY0FBUyxHQUFHLENBQUMsR0FBVyxFQUFFLElBQVksRUFBRSxXQUFtQixFQUFFLFNBQWlCLEVBQUUsRUFBRTtZQUN4RixHQUFHLElBQUksRUFBRSxDQUFDO1lBQ1YsTUFBTSxDQUFDLEdBQWEsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzQyxNQUFNLFFBQVEsR0FBVyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyRSxJQUFJLEdBQUcs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QU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxLQUFLLFdBQVcsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFFUyxnQkFBZ0IsQ0FBQyxXQUFtQixFQUFFLFVBQWtCO1FBQ2hFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUM7UUFDbEcsT0FBTyxDQUNMLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUM7WUFDdEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU87WUFDOUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQ2pFLENBQUM7SUFDSixDQUFDO0lBd0VPLFdBQVcsQ0FBQyxHQUFXO1FBQzdCLE9BQU8sR0FBRzthQUNQLEtBQUssQ0FBQyxFQUFFLENBQUM7YUFDVCxNQUFNLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO2FBQy9ELElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNkLENBQUM7Q0FHRixDQUFBOzs0Q0F2YnFCLE1BQU0sU0FBQyxNQUFNOztBQW5CdEIsa0JBQWtCO0lBRDlCLFVBQVUsRUFBRTtJQW9CUyxtQkFBQSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7O0dBbkJ2QixrQkFBa0IsQ0EwYzlCO1NBMWNZLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdCwgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBjb25maWcsIElDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XHJcblxyXG5leHBvcnQgZW51bSBTZXBhcmF0b3JzIHtcclxuICBTRVBBUkFUT1IgPSAnc2VwYXJhdG9yJyxcclxuICBDT01NQV9TRVBBUkFUT1IgPSAnY29tbWFfc2VwYXJhdG9yJyxcclxuICBET1RfU0VQQVJBVE9SID0gJ2RvdF9zZXBhcmF0b3InLFxyXG4gIElORF9DT01NQV9TRVBBUkFURUQgPSAnaW5kX2NvbW1hX3NlcGFyYXRlZCcsXHJcbiAgSU5UX0NPTU1BX1NFUEFSQVRFRCA9ICdpbnRfY29tbWFfc2VwYXJhdGVkJyxcclxuICBJTlRfU1BBQ0VfU0VQQVJBVEVEID0gJ2ludF9zcGFjZV9zZXBhcmF0ZWQnLFxyXG4gIElOVF9BUE9TVFJPUEhFX1NFUEFSQVRFRCA9ICdpbnRfYXBvc3Ryb3BoZV9zZXBhcmF0ZWQnXHJcbn1cclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIE1hc2tBcHBsaWVyU2VydmljZSB7XHJcbiAgcHVibGljIGRyb3BTcGVjaWFsQ2hhcmFjdGVyczogSUNvbmZpZ1snZHJvcFNwZWNpYWxDaGFyYWN0ZXJzJ107XHJcbiAgcHVibGljIGhpZGRlbklucHV0OiBJQ29uZmlnWydoaWRkZW5JbnB1dCddO1xyXG4gIHB1YmxpYyBzaG93VGVtcGxhdGUhOiBJQ29uZmlnWydzaG93VGVtcGxhdGUnXTtcclxuICBwdWJsaWMgY2xlYXJJZk5vdE1hdGNoITogSUNvbmZpZ1snY2xlYXJJZk5vdE1hdGNoJ107XHJcbiAgcHVibGljIG1hc2tFeHByZXNzaW9uOiBzdHJpbmcgPSAnJztcclxuICBwdWJsaWMgYWN0dWFsVmFsdWU6IHN0cmluZyA9ICcnO1xyXG4gIHB1YmxpYyBzaG93bk1hc2tFeHByZXNzaW9uOiBzdHJpbmcgPSAnJztcclxuICBwdWJsaWMgbWFza1NwZWNpYWxDaGFyYWN0ZXJzITogSUNvbmZpZ1snc3BlY2lhbENoYXJhY3RlcnMnXTtcclxuICBwdWJsaWMgbWFza0F2YWlsYWJsZVBhdHRlcm5zITogSUNvbmZpZ1sncGF0dGVybnMnXTtcclxuICBwdWJsaWMgcHJlZml4ITogSUNvbmZpZ1sncHJlZml4J107XHJcbiAgcHVibGljIHN1ZmZpeCE6IElDb25maWdbJ3N1ZmZpeCddO1xyXG4gIHB1YmxpYyBjdXN0b21QYXR0ZXJuITogSUNvbmZpZ1sncGF0dGVybnMnXTtcclxuICBwdWJsaWMgaXBFcnJvcj86IGJvb2xlYW47XHJcbiAgcHVibGljIHNob3dNYXNrVHlwZWQhOiBJQ29uZmlnWydzaG93TWFza1R5cGVkJ107XHJcbiAgcHVibGljIHZhbGlkYXRpb246IElDb25maWdbJ3ZhbGlkYXRpb24nXTtcclxuXHJcbiAgcHJpdmF0ZSBfc2hpZnQhOiBTZXQ8bnVtYmVyPjtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKEBJbmplY3QoY29uZmlnKSBwcm90ZWN0ZWQgX2NvbmZpZzogSUNvbmZpZykge1xyXG4gICAgdGhpcy5fc2hpZnQgPSBuZXcgU2V0KCk7XHJcbiAgICB0aGlzLmNsZWFySWZOb3RNYXRjaCA9IHRoaXMuX2NvbmZpZy5jbGVhcklmTm90TWF0Y2g7XHJcbiAgICB0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuX2NvbmZpZy5kcm9wU3BlY2lhbENoYXJhY3RlcnM7XHJcbiAgICB0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuX2NvbmZpZyEuc3BlY2lhbENoYXJhY3RlcnM7XHJcbiAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJucyA9IHRoaXMuX2NvbmZpZy5wYXR0ZXJucztcclxuICAgIHRoaXMucHJlZml4ID0gdGhpcy5fY29uZmlnLnByZWZpeDtcclxuICAgIHRoaXMuc3VmZml4ID0gdGhpcy5fY29uZmlnLnN1ZmZpeDtcclxuICAgIHRoaXMuaGlkZGVuSW5wdXQgPSB0aGlzLl9jb25maWcuaGlkZGVuSW5wdXQ7XHJcbiAgICB0aGlzLnNob3dNYXNrVHlwZWQgPSB0aGlzLl9jb25maWcuc2hvd01hc2tUeXBlZDtcclxuICAgIHRoaXMudmFsaWRhdGlvbiA9IHRoaXMuX2NvbmZpZy52YWxpZGF0aW9uO1xyXG4gIH1cclxuXHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxyXG4gIHB1YmxpYyBhcHBseU1hc2tXaXRoUGF0dGVybihpbnB1dFZhbHVlOiBzdHJpbmcsIG1hc2tBbmRQYXR0ZXJuOiBbc3RyaW5nLCBJQ29uZmlnWydwYXR0ZXJucyddXSk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBbbWFzaywgY3VzdG9tUGF0dGVybl0gPSBtYXNrQW5kUGF0dGVybjtcclxuICAgIHRoaXMuY3VzdG9tUGF0dGVybiA9IGN1c3RvbVBhdHRlcm47XHJcbiAgICByZXR1cm4gdGhpcy5hcHBseU1hc2soaW5wdXRWYWx1ZSwgbWFzayk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXBwbHlNYXNrKFxyXG4gICAgaW5wdXRWYWx1ZTogc3RyaW5nLFxyXG4gICAgbWFza0V4cHJlc3Npb246IHN0cmluZyxcclxuICAgIHBvc2l0aW9uOiBudW1iZXIgPSAwLFxyXG4gICAgY2I6IEZ1bmN0aW9uID0gKCkgPT4ge1xyXG4gICAgfSxcclxuICApOiBzdHJpbmcge1xyXG4gICAgaWYgKGlucHV0VmFsdWUgPT09IHVuZGVmaW5lZCB8fCBpbnB1dFZhbHVlID09PSBudWxsIHx8IG1hc2tFeHByZXNzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG4gICAgbGV0IGN1cnNvcjogbnVtYmVyID0gMDtcclxuICAgIGxldCByZXN1bHQ6IHN0cmluZyA9IGBgO1xyXG4gICAgbGV0IG11bHRpOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBsZXQgYmFja3NwYWNlU2hpZnQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIGxldCBzaGlmdDogbnVtYmVyID0gMTtcclxuICAgIGxldCBzdGVwQmFjazogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgaWYgKGlucHV0VmFsdWUuc2xpY2UoMCwgdGhpcy5wcmVmaXgubGVuZ3RoKSA9PT0gdGhpcy5wcmVmaXgpIHtcclxuICAgICAgaW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUuc2xpY2UodGhpcy5wcmVmaXgubGVuZ3RoLCBpbnB1dFZhbHVlLmxlbmd0aCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpbnB1dEFycmF5OiBzdHJpbmdbXSA9IGlucHV0VmFsdWUudG9TdHJpbmcoKS5zcGxpdCgnJyk7XHJcbiAgICBpZiAobWFza0V4cHJlc3Npb24gPT09ICdJUCcpIHtcclxuICAgICAgdGhpcy5pcEVycm9yID0gISEoaW5wdXRBcnJheS5maWx0ZXIoKGk6IHN0cmluZykgPT4gaSA9PT0gJy4nKS5sZW5ndGggPCAzICYmIGlucHV0QXJyYXkubGVuZ3RoIDwgNyk7XHJcbiAgICAgIG1hc2tFeHByZXNzaW9uID0gJzA5OS4wOTkuMDk5LjA5OSc7XHJcbiAgICB9XHJcbiAgICBpZiAobWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aCgncGVyY2VudCcpKSB7XHJcbiAgICAgIGlmIChpbnB1dFZhbHVlLm1hdGNoKCdbYS16XXxbQS1aXScpIHx8IGlucHV0VmFsdWUubWF0Y2goL1stISQlXiYqKClfK3x+PWB7fVxcW1xcXTpcIjsnPD4/LFxcL10vKSkge1xyXG4gICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLl9jaGVja0lucHV0KGlucHV0VmFsdWUpO1xyXG4gICAgICAgIGNvbnN0IHByZWNpc2lvbjogbnVtYmVyID0gdGhpcy5nZXRQcmVjaXNpb24obWFza0V4cHJlc3Npb24pO1xyXG4gICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLmNoZWNrSW5wdXRQcmVjaXNpb24oaW5wdXRWYWx1ZSwgcHJlY2lzaW9uLCAnLicpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpbnB1dFZhbHVlLmluZGV4T2YoJy4nKSA+IDAgJiYgIXRoaXMucGVyY2VudGFnZShpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmluZGV4T2YoJy4nKSkpKSB7XHJcbiAgICAgICAgY29uc3QgYmFzZTogc3RyaW5nID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5pbmRleE9mKCcuJykgLSAxKTtcclxuICAgICAgICBpbnB1dFZhbHVlID0gYCR7YmFzZX0ke2lucHV0VmFsdWUuc3Vic3RyaW5nKGlucHV0VmFsdWUuaW5kZXhPZignLicpLCBpbnB1dFZhbHVlLmxlbmd0aCl9YDtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5wZXJjZW50YWdlKGlucHV0VmFsdWUpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gaW5wdXRWYWx1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKFxyXG4gICAgICBtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuU0VQQVJBVE9SKSB8fFxyXG4gICAgICBtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuRE9UX1NFUEFSQVRPUikgfHxcclxuICAgICAgbWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChTZXBhcmF0b3JzLkNPTU1BX1NFUEFSQVRPUikgfHxcclxuICAgICAgbWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChTZXBhcmF0b3JzLklORF9DT01NQV9TRVBBUkFURUQpIHx8XHJcbiAgICAgIG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoU2VwYXJhdG9ycy5JTlRfQVBPU1RST1BIRV9TRVBBUkFURUQpIHx8XHJcbiAgICAgIG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoU2VwYXJhdG9ycy5JTlRfQ09NTUFfU0VQQVJBVEVEKSB8fFxyXG4gICAgICBtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuSU5UX1NQQUNFX1NFUEFSQVRFRClcclxuICAgICkge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgaW5wdXRWYWx1ZS5tYXRjaCgnW3fQsC3Rj9CQLdCvXScpIHx8XHJcbiAgICAgICAgaW5wdXRWYWx1ZS5tYXRjaCgnW9CB0ZHQkC3Rj10nKSB8fFxyXG4gICAgICAgIGlucHV0VmFsdWUubWF0Y2goJ1thLXpdfFtBLVpdJykgfHxcclxuICAgICAgICBpbnB1dFZhbHVlLm1hdGNoKC9bLUAjISQlXFxcXF4mKigpX8KjwqwnK3x+PWB7fVxcW1xcXTpcIjs8Pi4/XFwvXS8pXHJcbiAgICAgICkge1xyXG4gICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLl9jaGVja0lucHV0KGlucHV0VmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHByZWNpc2lvbjogbnVtYmVyID0gdGhpcy5nZXRQcmVjaXNpb24obWFza0V4cHJlc3Npb24pO1xyXG4gICAgICBsZXQgc3RyRm9yU2VwOiBzdHJpbmc7XHJcbiAgICAgIGlmIChtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuU0VQQVJBVE9SKSkge1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIGlucHV0VmFsdWUuaW5jbHVkZXMoJywnKSAmJlxyXG4gICAgICAgICAgaW5wdXRWYWx1ZS5lbmRzV2l0aCgnLCcpICYmXHJcbiAgICAgICAgICBpbnB1dFZhbHVlLmluZGV4T2YoJywnKSAhPT0gaW5wdXRWYWx1ZS5sYXN0SW5kZXhPZignLCcpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUucmVwbGFjZSgnLicsICcgJyk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoU2VwYXJhdG9ycy5ET1RfU0VQQVJBVE9SKSkge1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIGlucHV0VmFsdWUuaW5kZXhPZignLicpICE9PSAtMSAmJlxyXG4gICAgICAgICAgaW5wdXRWYWx1ZS5pbmRleE9mKCcuJykgPT09IGlucHV0VmFsdWUubGFzdEluZGV4T2YoJy4nKSAmJlxyXG4gICAgICAgICAgKGlucHV0VmFsdWUuaW5kZXhPZignLicpID4gMyB8fCBpbnB1dFZhbHVlLmxlbmd0aCA8IDYpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS5yZXBsYWNlKCcuJywgJywnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5wdXRWYWx1ZSA9XHJcbiAgICAgICAgICBpbnB1dFZhbHVlLmxlbmd0aCA+IDEgJiYgaW5wdXRWYWx1ZVswXSA9PT0gJzAnICYmIGlucHV0VmFsdWVbMV0gIT09ICcsJ1xyXG4gICAgICAgICAgICA/IGlucHV0VmFsdWUuc2xpY2UoMSwgaW5wdXRWYWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgIDogaW5wdXRWYWx1ZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChTZXBhcmF0b3JzLkNPTU1BX1NFUEFSQVRPUikpIHtcclxuICAgICAgICBpbnB1dFZhbHVlID1cclxuICAgICAgICAgIGlucHV0VmFsdWUubGVuZ3RoID4gMSAmJiBpbnB1dFZhbHVlWzBdID09PSAnMCcgJiYgaW5wdXRWYWx1ZVsxXSAhPT0gJy4nXHJcbiAgICAgICAgICAgID8gaW5wdXRWYWx1ZS5zbGljZSgxLCBpbnB1dFZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgOiBpbnB1dFZhbHVlO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuU0VQQVJBVE9SKSkge1xyXG4gICAgICAgIGlmIChpbnB1dFZhbHVlLm1hdGNoKC9bQCMhJCVeJiooKV8rfH49YHt9XFxbXFxdOi5cIjs8Pj9cXC9dLykpIHtcclxuICAgICAgICAgIGlucHV0VmFsdWUgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbnB1dFZhbHVlID0gdGhpcy5jaGVja0lucHV0UHJlY2lzaW9uKGlucHV0VmFsdWUsIHByZWNpc2lvbiwgJywnKTtcclxuICAgICAgICBzdHJGb3JTZXAgPSBpbnB1dFZhbHVlLnJlcGxhY2UoL1xccy9nLCAnJyk7XHJcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5zZXBhcmF0b3Ioc3RyRm9yU2VwLCAnICcsICcsJywgcHJlY2lzaW9uKTtcclxuICAgICAgfSBlbHNlIGlmIChtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuRE9UX1NFUEFSQVRPUikpIHtcclxuICAgICAgICBpZiAoaW5wdXRWYWx1ZS5tYXRjaCgvW0AjISQlXiYqKClfK3x+PWB7fVxcW1xcXTpcXHNcIjs8Pj9cXC9dLykpIHtcclxuICAgICAgICAgIGlucHV0VmFsdWUgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbnB1dFZhbHVlID0gdGhpcy5jaGVja0lucHV0UHJlY2lzaW9uKGlucHV0VmFsdWUsIHByZWNpc2lvbiwgJywnKTtcclxuICAgICAgICBzdHJGb3JTZXAgPSBpbnB1dFZhbHVlLnJlcGxhY2UoL1xcLi9nLCAnJyk7XHJcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5zZXBhcmF0b3Ioc3RyRm9yU2VwLCAnLicsICcsJywgcHJlY2lzaW9uKTtcclxuICAgICAgfSBlbHNlIGlmIChtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuQ09NTUFfU0VQQVJBVE9SKSkge1xyXG4gICAgICAgIHN0ckZvclNlcCA9IGlucHV0VmFsdWUucmVwbGFjZSgvLC9nLCAnJyk7XHJcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5zZXBhcmF0b3Ioc3RyRm9yU2VwLCAnLCcsICcuJywgcHJlY2lzaW9uKTtcclxuICAgICAgfSBlbHNlIGlmIChtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuSU5EX0NPTU1BX1NFUEFSQVRFRCkpIHtcclxuICAgICAgICBzdHJGb3JTZXAgPSBpbnB1dFZhbHVlLnJlcGxhY2UoLywvZywgJycpO1xyXG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY3VycmVuY3lTZXBhcmF0b3Ioc3RyRm9yU2VwLCAnLCcsICcuJywgcHJlY2lzaW9uLCB0cnVlKTtcclxuICAgICAgfSBlbHNlIGlmIChtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuSU5UX1NQQUNFX1NFUEFSQVRFRCkpIHtcclxuICAgICAgICBzdHJGb3JTZXAgPSBpbnB1dFZhbHVlLnJlcGxhY2UoL1sgLCddL2csICcnKTtcclxuICAgICAgICByZXN1bHQgPSB0aGlzLmN1cnJlbmN5U2VwYXJhdG9yKHN0ckZvclNlcCwgJyAnLCAnLicsIHByZWNpc2lvbik7XHJcbiAgICAgIH0gZWxzZSBpZiAobWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChTZXBhcmF0b3JzLklOVF9DT01NQV9TRVBBUkFURUQpKSB7XHJcbiAgICAgICAgc3RyRm9yU2VwID0gaW5wdXRWYWx1ZS5yZXBsYWNlKC8sL2csICcnKTtcclxuICAgICAgICByZXN1bHQgPSB0aGlzLmN1cnJlbmN5U2VwYXJhdG9yKHN0ckZvclNlcCwgJywnLCAnLicsIHByZWNpc2lvbik7XHJcbiAgICAgIH0gZWxzZSBpZiAobWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aChTZXBhcmF0b3JzLklOVF9BUE9TVFJPUEhFX1NFUEFSQVRFRCkpIHtcclxuICAgICAgICBzdHJGb3JTZXAgPSBpbnB1dFZhbHVlLnJlcGxhY2UoL1sgLCddL2csICcnKTtcclxuICAgICAgICByZXN1bHQgPSB0aGlzLmN1cnJlbmN5U2VwYXJhdG9yKHN0ckZvclNlcCwgJ1xcJycsICcuJywgcHJlY2lzaW9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgY29tbWFTaGlmdDogbnVtYmVyID0gcmVzdWx0LmluZGV4T2YoJywnKSAtIGlucHV0VmFsdWUuaW5kZXhPZignLCcpO1xyXG4gICAgICBjb25zdCBzaGlmdFN0ZXA6IG51bWJlciA9IHJlc3VsdC5sZW5ndGggLSBpbnB1dFZhbHVlLmxlbmd0aDtcclxuXHJcbiAgICAgIC8vIHBvc2l0aW9uIHNoaWZ0aW5nIGlzc3VlIGZpeGVkIGZvciBjdXN0b20gc2VwYXJhdG9yc1xyXG4gICAgICBpZiAoIShtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuSU5EX0NPTU1BX1NFUEFSQVRFRCkgfHxcclxuICAgICAgICBtYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKFNlcGFyYXRvcnMuSU5UX0FQT1NUUk9QSEVfU0VQQVJBVEVEKSB8fFxyXG4gICAgICAgIG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoU2VwYXJhdG9ycy5JTlRfQ09NTUFfU0VQQVJBVEVEKSB8fFxyXG4gICAgICAgIG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoU2VwYXJhdG9ycy5JTlRfU1BBQ0VfU0VQQVJBVEVEKSkpIHtcclxuICAgICAgICBpZiAoc2hpZnRTdGVwID4gMCAmJiByZXN1bHRbcG9zaXRpb25dICE9PSAnLCcpIHtcclxuICAgICAgICAgIGJhY2tzcGFjZVNoaWZ0ID0gdHJ1ZTtcclxuICAgICAgICAgIGxldCBfc2hpZnQ6IG51bWJlciA9IDA7XHJcbiAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NoaWZ0LmFkZChwb3NpdGlvbiArIF9zaGlmdCk7XHJcbiAgICAgICAgICAgIF9zaGlmdCsrO1xyXG4gICAgICAgICAgfSB3aGlsZSAoX3NoaWZ0IDwgc2hpZnRTdGVwKTtcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgKGNvbW1hU2hpZnQgIT09IDAgJiYgcG9zaXRpb24gPiAwICYmICEocmVzdWx0LmluZGV4T2YoJywnKSA+PSBwb3NpdGlvbiAmJiBwb3NpdGlvbiA+IDMpKSB8fFxyXG4gICAgICAgICAgKCEocmVzdWx0LmluZGV4T2YoJy4nKSA+PSBwb3NpdGlvbiAmJiBwb3NpdGlvbiA+IDMpICYmIHNoaWZ0U3RlcCA8PSAwKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgdGhpcy5fc2hpZnQuY2xlYXIoKTtcclxuICAgICAgICAgIGJhY2tzcGFjZVNoaWZ0ID0gdHJ1ZTtcclxuICAgICAgICAgIHNoaWZ0ID0gc2hpZnRTdGVwO1xyXG4gICAgICAgICAgcG9zaXRpb24gKz0gc2hpZnRTdGVwO1xyXG4gICAgICAgICAgdGhpcy5fc2hpZnQuYWRkKHBvc2l0aW9uKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5fc2hpZnQuY2xlYXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmb3IgKFxyXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxyXG4gICAgICAgIGxldCBpOiBudW1iZXIgPSAwLCBpbnB1dFN5bWJvbDogc3RyaW5nID0gaW5wdXRBcnJheVswXTtcclxuICAgICAgICBpIDwgaW5wdXRBcnJheS5sZW5ndGg7XHJcbiAgICAgICAgaSsrLCBpbnB1dFN5bWJvbCA9IGlucHV0QXJyYXlbaV1cclxuICAgICAgKSB7XHJcbiAgICAgICAgaWYgKGN1cnNvciA9PT0gbWFza0V4cHJlc3Npb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2NoZWNrU3ltYm9sTWFzayhpbnB1dFN5bWJvbCwgbWFza0V4cHJlc3Npb25bY3Vyc29yXSkgJiYgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMV0gPT09ICc/Jykge1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgICAgY3Vyc29yICs9IDI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgIG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnKicgJiZcclxuICAgICAgICAgIG11bHRpICYmXHJcbiAgICAgICAgICB0aGlzLl9jaGVja1N5bWJvbE1hc2soaW5wdXRTeW1ib2wsIG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDJdKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgICAgY3Vyc29yICs9IDM7XHJcbiAgICAgICAgICBtdWx0aSA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLl9jaGVja1N5bWJvbE1hc2soaW5wdXRTeW1ib2wsIG1hc2tFeHByZXNzaW9uW2N1cnNvcl0pICYmXHJcbiAgICAgICAgICBtYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAxXSA9PT0gJyonXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gaW5wdXRTeW1ib2w7XHJcbiAgICAgICAgICBtdWx0aSA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgIG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnPycgJiZcclxuICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9sTWFzayhpbnB1dFN5bWJvbCwgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMl0pXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gaW5wdXRTeW1ib2w7XHJcbiAgICAgICAgICBjdXJzb3IgKz0gMztcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sLCBtYXNrRXhwcmVzc2lvbltjdXJzb3JdKSB8fFxyXG4gICAgICAgICAgKHRoaXMuaGlkZGVuSW5wdXQgJiZcclxuICAgICAgICAgICAgdGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza0V4cHJlc3Npb25bY3Vyc29yXV0gJiZcclxuICAgICAgICAgICAgdGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza0V4cHJlc3Npb25bY3Vyc29yXV0uc3ltYm9sID09PSBpbnB1dFN5bWJvbClcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSAnSCcpIHtcclxuICAgICAgICAgICAgaWYgKE51bWJlcihpbnB1dFN5bWJvbCkgPiAyKSB7XHJcbiAgICAgICAgICAgICAgY3Vyc29yICs9IDE7XHJcbiAgICAgICAgICAgICAgY29uc3Qgc2hpZnRTdGVwOiBudW1iZXIgPSAvWyo/XS9nLnRlc3QobWFza0V4cHJlc3Npb24uc2xpY2UoMCwgY3Vyc29yKSlcclxuICAgICAgICAgICAgICAgID8gaW5wdXRBcnJheS5sZW5ndGhcclxuICAgICAgICAgICAgICAgIDogY3Vyc29yO1xyXG4gICAgICAgICAgICAgIHRoaXMuX3NoaWZ0LmFkZChzaGlmdFN0ZXAgKyB0aGlzLnByZWZpeC5sZW5ndGggfHwgMCk7XHJcbiAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAobWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gJ2gnKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09ICcyJyAmJiBOdW1iZXIoaW5wdXRTeW1ib2wpID4gMykge1xyXG4gICAgICAgICAgICAgIGN1cnNvciArPSAxO1xyXG4gICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdtJykge1xyXG4gICAgICAgICAgICBpZiAoTnVtYmVyKGlucHV0U3ltYm9sKSA+IDUpIHtcclxuICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcclxuICAgICAgICAgICAgICBjb25zdCBzaGlmdFN0ZXA6IG51bWJlciA9IC9bKj9dL2cudGVzdChtYXNrRXhwcmVzc2lvbi5zbGljZSgwLCBjdXJzb3IpKVxyXG4gICAgICAgICAgICAgICAgPyBpbnB1dEFycmF5Lmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgOiBjdXJzb3I7XHJcbiAgICAgICAgICAgICAgdGhpcy5fc2hpZnQuYWRkKHNoaWZ0U3RlcCArIHRoaXMucHJlZml4Lmxlbmd0aCB8fCAwKTtcclxuICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSAncycpIHtcclxuICAgICAgICAgICAgaWYgKE51bWJlcihpbnB1dFN5bWJvbCkgPiA1KSB7XHJcbiAgICAgICAgICAgICAgY3Vyc29yICs9IDE7XHJcbiAgICAgICAgICAgICAgY29uc3Qgc2hpZnRTdGVwOiBudW1iZXIgPSAvWyo/XS9nLnRlc3QobWFza0V4cHJlc3Npb24uc2xpY2UoMCwgY3Vyc29yKSlcclxuICAgICAgICAgICAgICAgID8gaW5wdXRBcnJheS5sZW5ndGhcclxuICAgICAgICAgICAgICAgIDogY3Vyc29yO1xyXG4gICAgICAgICAgICAgIHRoaXMuX3NoaWZ0LmFkZChzaGlmdFN0ZXAgKyB0aGlzLnByZWZpeC5sZW5ndGggfHwgMCk7XHJcbiAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAobWFza0V4cHJlc3Npb25bY3Vyc29yIC0gMV0gPT09ICdkJykge1xyXG4gICAgICAgICAgICBpZiAoTnVtYmVyKGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMSwgY3Vyc29yICsgMSkpID4gMzEgfHwgaW5wdXRWYWx1ZVtjdXJzb3JdID09PSAnLycpIHtcclxuICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcclxuICAgICAgICAgICAgICBjb25zdCBzaGlmdFN0ZXA6IG51bWJlciA9IC9bKj9dL2cudGVzdChtYXNrRXhwcmVzc2lvbi5zbGljZSgwLCBjdXJzb3IpKVxyXG4gICAgICAgICAgICAgICAgPyBpbnB1dEFycmF5Lmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgOiBjdXJzb3I7XHJcbiAgICAgICAgICAgICAgdGhpcy5fc2hpZnQuYWRkKHNoaWZ0U3RlcCArIHRoaXMucHJlZml4Lmxlbmd0aCB8fCAwKTtcclxuICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSAnTScpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgIChpbnB1dFZhbHVlW2N1cnNvciAtIDFdID09PSAnLycgJiZcclxuICAgICAgICAgICAgICAgIChOdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IsIGN1cnNvciArIDIpKSA+IDEyIHx8XHJcbiAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbY3Vyc29yICsgMV0gPT09ICcvJykpIHx8XHJcbiAgICAgICAgICAgICAgKE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDEsIGN1cnNvciArIDEpKSA+IDEyIHx8XHJcbiAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZS5zbGljZSgwLCAyKSkgPiAzMSB8fFxyXG4gICAgICAgICAgICAgICAgKE51bWJlcihpbnB1dFZhbHVlW2N1cnNvciAtIDFdKSA+IDEgJiYgaW5wdXRWYWx1ZVtjdXJzb3IgLSAyXSA9PT0gJy8nKSlcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgY3Vyc29yICs9IDE7XHJcbiAgICAgICAgICAgICAgY29uc3Qgc2hpZnRTdGVwOiBudW1iZXIgPSAvWyo/XS9nLnRlc3QobWFza0V4cHJlc3Npb24uc2xpY2UoMCwgY3Vyc29yKSlcclxuICAgICAgICAgICAgICAgID8gaW5wdXRBcnJheS5sZW5ndGhcclxuICAgICAgICAgICAgICAgIDogY3Vyc29yO1xyXG4gICAgICAgICAgICAgIHRoaXMuX3NoaWZ0LmFkZChzaGlmdFN0ZXAgKyB0aGlzLnByZWZpeC5sZW5ndGggfHwgMCk7XHJcbiAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgICAgY3Vyc29yKys7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmRleE9mKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0pICE9PSAtMSkge1xyXG4gICAgICAgICAgcmVzdWx0ICs9IG1hc2tFeHByZXNzaW9uW2N1cnNvcl07XHJcbiAgICAgICAgICBjdXJzb3IrKztcclxuICAgICAgICAgIGNvbnN0IHNoaWZ0U3RlcDogbnVtYmVyID0gL1sqP10vZy50ZXN0KG1hc2tFeHByZXNzaW9uLnNsaWNlKDAsIGN1cnNvcikpXHJcbiAgICAgICAgICAgID8gaW5wdXRBcnJheS5sZW5ndGhcclxuICAgICAgICAgICAgOiBjdXJzb3I7XHJcbiAgICAgICAgICB0aGlzLl9zaGlmdC5hZGQoc2hpZnRTdGVwICsgdGhpcy5wcmVmaXgubGVuZ3RoIHx8IDApO1xyXG4gICAgICAgICAgaS0tO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmRleE9mKGlucHV0U3ltYm9sKSA+IC0xICYmXHJcbiAgICAgICAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltjdXJzb3JdXSAmJlxyXG4gICAgICAgICAgdGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza0V4cHJlc3Npb25bY3Vyc29yXV0ub3B0aW9uYWxcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGN1cnNvcisrO1xyXG4gICAgICAgICAgaS0tO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnKicgJiZcclxuICAgICAgICAgIHRoaXMuX2ZpbmRTcGVjaWFsQ2hhcih0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDJdKSAmJlxyXG4gICAgICAgICAgdGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKSA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSAmJlxyXG4gICAgICAgICAgbXVsdGlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGN1cnNvciArPSAzO1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnPycgJiZcclxuICAgICAgICAgIHRoaXMuX2ZpbmRTcGVjaWFsQ2hhcih0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDJdKSAmJlxyXG4gICAgICAgICAgdGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKSA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSAmJlxyXG4gICAgICAgICAgbXVsdGlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGN1cnNvciArPSAzO1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLnNob3dNYXNrVHlwZWQgJiZcclxuICAgICAgICAgIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YoaW5wdXRTeW1ib2wpIDwgMCAmJlxyXG4gICAgICAgICAgaW5wdXRTeW1ib2wgIT09ICdfJ1xyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgc3RlcEJhY2sgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKFxyXG4gICAgICByZXN1bHQubGVuZ3RoICsgMSA9PT0gbWFza0V4cHJlc3Npb24ubGVuZ3RoICYmXHJcbiAgICAgIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YobWFza0V4cHJlc3Npb25bbWFza0V4cHJlc3Npb24ubGVuZ3RoIC0gMV0pICE9PSAtMVxyXG4gICAgKSB7XHJcbiAgICAgIHJlc3VsdCArPSBtYXNrRXhwcmVzc2lvblttYXNrRXhwcmVzc2lvbi5sZW5ndGggLSAxXTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbmV3UG9zaXRpb246IG51bWJlciA9IHBvc2l0aW9uICsgMTtcclxuXHJcbiAgICB3aGlsZSAodGhpcy5fc2hpZnQuaGFzKG5ld1Bvc2l0aW9uKSkge1xyXG4gICAgICBzaGlmdCsrO1xyXG4gICAgICBuZXdQb3NpdGlvbisrO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBhY3R1YWxTaGlmdDogbnVtYmVyID0gdGhpcy5fc2hpZnQuaGFzKHBvc2l0aW9uKSA/IHNoaWZ0IDogMDtcclxuICAgIGlmIChzdGVwQmFjaykge1xyXG4gICAgICBhY3R1YWxTaGlmdC0tO1xyXG4gICAgfVxyXG5cclxuICAgIGNiKGFjdHVhbFNoaWZ0LCBiYWNrc3BhY2VTaGlmdCk7XHJcbiAgICBpZiAoc2hpZnQgPCAwKSB7XHJcbiAgICAgIHRoaXMuX3NoaWZ0LmNsZWFyKCk7XHJcbiAgICB9XHJcbiAgICBsZXQgcmVzOiBzdHJpbmcgPSB0aGlzLnN1ZmZpeCA/IGAke3RoaXMucHJlZml4fSR7cmVzdWx0fSR7dGhpcy5zdWZmaXh9YCA6IGAke3RoaXMucHJlZml4fSR7cmVzdWx0fWA7XHJcbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXMgPSBgJHt0aGlzLnByZWZpeH0ke3Jlc3VsdH1gO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBfZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sOiBzdHJpbmcpOiB1bmRlZmluZWQgfCBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmZpbmQoKHZhbDogc3RyaW5nKSA9PiB2YWwgPT09IGlucHV0U3ltYm9sKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBfY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sOiBzdHJpbmcsIG1hc2tTeW1ib2w6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgdGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnMgPSB0aGlzLmN1c3RvbVBhdHRlcm4gPyB0aGlzLmN1c3RvbVBhdHRlcm4gOiB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJucztcclxuICAgIHJldHVybiAoXHJcbiAgICAgIHRoaXMubWFza0F2YWlsYWJsZVBhdHRlcm5zW21hc2tTeW1ib2xdICYmXHJcbiAgICAgIHRoaXMubWFza0F2YWlsYWJsZVBhdHRlcm5zW21hc2tTeW1ib2xdLnBhdHRlcm4gJiZcclxuICAgICAgdGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza1N5bWJvbF0ucGF0dGVybi50ZXN0KGlucHV0U3ltYm9sKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc2VwYXJhdG9yID0gKHN0cjogc3RyaW5nLCBjaGFyOiBzdHJpbmcsIGRlY2ltYWxDaGFyOiBzdHJpbmcsIHByZWNpc2lvbjogbnVtYmVyKSA9PiB7XHJcbiAgICBzdHIgKz0gJyc7XHJcbiAgICBjb25zdCB4OiBzdHJpbmdbXSA9IHN0ci5zcGxpdChkZWNpbWFsQ2hhcik7XHJcbiAgICBjb25zdCBkZWNpbWFsczogc3RyaW5nID0geC5sZW5ndGggPiAxID8gYCR7ZGVjaW1hbENoYXJ9JHt4WzFdfWAgOiAnJztcclxuICAgIGxldCByZXM6IHN0cmluZyA9IHhbMF07XHJcbiAgICBjb25zdCByZ3g6IFJlZ0V4cCA9IC8oXFxkKykoXFxkezN9KS87XHJcbiAgICB3aGlsZSAocmd4LnRlc3QocmVzKSkge1xyXG4gICAgICByZXMgPSByZXMucmVwbGFjZShyZ3gsICckMScgKyBjaGFyICsgJyQyJyk7XHJcbiAgICB9XHJcbiAgICBpZiAocHJlY2lzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHJlcyArIGRlY2ltYWxzO1xyXG4gICAgfSBlbHNlIGlmIChwcmVjaXNpb24gPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuICAgIHJldHVybiByZXMgKyBkZWNpbWFscy5zdWJzdHIoMCwgcHJlY2lzaW9uICsgMSk7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBjdXJyZW5jeVNlcGFyYXRvciA9IChzdHI6IHN0cmluZywgY2hhcjogc3RyaW5nLCBkZWNpbWFsQ2hhcjogc3RyaW5nLCBwcmVjaXNpb246IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZEZvcm1hdDogYm9vbGVhbiA9IGZhbHNlKSA9PiB7XHJcbiAgICBzdHIgKz0gJyc7XHJcbiAgICBjb25zdCB4OiBzdHJpbmdbXSA9IHN0ci5zcGxpdChkZWNpbWFsQ2hhcik7XHJcbiAgICBjb25zdCBkZWNpbWFsczogc3RyaW5nID0geC5sZW5ndGggPiAxID8gYCR7ZGVjaW1hbENoYXJ9JHt4WzFdfWAgOiAnJztcclxuICAgIGNvbnN0IGJhc2VOdW06IHN0cmluZyA9IHhbMF07XHJcbiAgICBsZXQgbGFzdFRocmVlOiBzdHJpbmcgPSBiYXNlTnVtLnN1YnN0cmluZyhiYXNlTnVtLmxlbmd0aCAtIDMpO1xyXG4gICAgY29uc3Qgb3RoZXJOdW1iZXJzOiBzdHJpbmcgPSBiYXNlTnVtLnN1YnN0cmluZygwLCBiYXNlTnVtLmxlbmd0aCAtIDMpO1xyXG4gICAgaWYgKG90aGVyTnVtYmVycyAhPT0gJycpIHtcclxuICAgICAgbGFzdFRocmVlID0gY2hhciArIGxhc3RUaHJlZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlczogc3RyaW5nID0gKGluZEZvcm1hdCA/IG90aGVyTnVtYmVycy5yZXBsYWNlKC9cXEIoPz0oXFxkezJ9KSsoPyFcXGQpKS9nLCBjaGFyKSA6XHJcbiAgICAgIG90aGVyTnVtYmVycy5yZXBsYWNlKC9cXEIoPz0oXFxkezN9KSsoPyFcXGQpKS9nLCBjaGFyKSkgKyBsYXN0VGhyZWU7XHJcbiAgICBpZiAocHJlY2lzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHJlcyArIGRlY2ltYWxzO1xyXG4gICAgfSBlbHNlIGlmIChwcmVjaXNpb24gPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuICAgIHJldHVybiByZXMgKyBkZWNpbWFscy5zdWJzdHIoMCwgcHJlY2lzaW9uICsgMSk7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBwZXJjZW50YWdlID0gKHN0cjogc3RyaW5nKTogYm9vbGVhbiA9PiB7XHJcbiAgICByZXR1cm4gTnVtYmVyKHN0cikgPj0gMCAmJiBOdW1iZXIoc3RyKSA8PSAxMDA7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBnZXRQcmVjaXNpb24gPSAobWFza0V4cHJlc3Npb246IHN0cmluZyk6IG51bWJlciA9PiB7XHJcbiAgICBjb25zdCB4OiBzdHJpbmdbXSA9IG1hc2tFeHByZXNzaW9uLnNwbGl0KCcuJyk7XHJcbiAgICBpZiAoeC5sZW5ndGggPiAxKSB7XHJcbiAgICAgIHJldHVybiBOdW1iZXIoeFt4Lmxlbmd0aCAtIDFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBJbmZpbml0eTtcclxuICB9O1xyXG5cclxuICBwcml2YXRlIGNoZWNrSW5wdXRQcmVjaXNpb24gPSAoaW5wdXRWYWx1ZTogc3RyaW5nLCBwcmVjaXNpb246IG51bWJlciwgZGVjaW1hbE1hcmtlcjogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuICAgIGlmIChwcmVjaXNpb24gPCBJbmZpbml0eSkge1xyXG4gICAgICBsZXQgcHJlY2lzaW9uUmVnRXg6IFJlZ0V4cDtcclxuXHJcbiAgICAgIGlmIChkZWNpbWFsTWFya2VyID09PSAnLicpIHtcclxuICAgICAgICBwcmVjaXNpb25SZWdFeCA9IG5ldyBSZWdFeHAoYFxcXFwuXFxcXGR7JHtwcmVjaXNpb259fS4qJGApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByZWNpc2lvblJlZ0V4ID0gbmV3IFJlZ0V4cChgLFxcXFxkeyR7cHJlY2lzaW9ufX0uKiRgKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcHJlY2lzaW9uTWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsID0gaW5wdXRWYWx1ZS5tYXRjaChwcmVjaXNpb25SZWdFeCk7XHJcbiAgICAgIGlmIChwcmVjaXNpb25NYXRjaCAmJiBwcmVjaXNpb25NYXRjaFswXS5sZW5ndGggLSAxID4gcHJlY2lzaW9uKSB7XHJcbiAgICAgICAgaW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUuc3Vic3RyaW5nKDAsIGlucHV0VmFsdWUubGVuZ3RoIC0gMSk7XHJcbiAgICAgIH0gZWxzZSBpZiAocHJlY2lzaW9uID09PSAwICYmIGlucHV0VmFsdWUuZW5kc1dpdGgoZGVjaW1hbE1hcmtlcikpIHtcclxuICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5sZW5ndGggLSAxKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGlucHV0VmFsdWU7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBfY2hlY2tJbnB1dChzdHI6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gc3RyXHJcbiAgICAgIC5zcGxpdCgnJylcclxuICAgICAgLmZpbHRlcigoaTogc3RyaW5nKSA9PiBpLm1hdGNoKCdcXFxcZCcpIHx8IGkgPT09ICcuJyB8fCBpID09PSAnLCcpXHJcbiAgICAgIC5qb2luKCcnKTtcclxuICB9XHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWF4LWZpbGUtbGluZS1jb3VudFxyXG59XHJcbiJdfQ==