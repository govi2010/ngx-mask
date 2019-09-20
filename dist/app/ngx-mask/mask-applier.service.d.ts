import { IConfig } from './config';
export declare enum Separators {
    SEPARATOR = "separator",
    COMMA_SEPARATOR = "comma_separator",
    DOT_SEPARATOR = "dot_separator",
    IND_COMMA_SEPARATED = "ind_comma_separated",
    INT_COMMA_SEPARATED = "int_comma_separated",
    INT_SPACE_SEPARATED = "int_space_separated",
    INT_APOSTROPHE_SEPARATED = "int_apostrophe_separated"
}
export declare class MaskApplierService {
    protected _config: IConfig;
    dropSpecialCharacters: IConfig['dropSpecialCharacters'];
    hiddenInput: IConfig['hiddenInput'];
    showTemplate: IConfig['showTemplate'];
    clearIfNotMatch: IConfig['clearIfNotMatch'];
    maskExpression: string;
    actualValue: string;
    shownMaskExpression: string;
    maskSpecialCharacters: IConfig['specialCharacters'];
    maskAvailablePatterns: IConfig['patterns'];
    prefix: IConfig['prefix'];
    suffix: IConfig['suffix'];
    customPattern: IConfig['patterns'];
    ipError?: boolean;
    showMaskTyped: IConfig['showMaskTyped'];
    validation: IConfig['validation'];
    private _shift;
    constructor(_config: IConfig);
    applyMaskWithPattern(inputValue: string, maskAndPattern: [string, IConfig['patterns']]): string;
    applyMask(inputValue: string, maskExpression: string, position?: number, cb?: Function): string;
    _findSpecialChar(inputSymbol: string): undefined | string;
    protected _checkSymbolMask(inputSymbol: string, maskSymbol: string): boolean;
    private separator;
    private currencySeparator;
    private percentage;
    private getPrecision;
    private checkInputPrecision;
    private _checkInput;
}
