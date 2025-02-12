import { ElementRef, Renderer2 } from '@angular/core';
import { IConfig } from './config';
import { MaskApplierService } from './mask-applier.service';
export declare class MaskService extends MaskApplierService {
    private document;
    protected _config: IConfig;
    private _elementRef;
    private _renderer;
    validation: boolean;
    maskExpression: string;
    isNumberValue: boolean;
    showMaskTyped: boolean;
    maskIsShown: string;
    selStart: number | null;
    selEnd: number | null;
    protected _formElement: HTMLInputElement;
    onChange: (_: any) => void;
    constructor(document: any, _config: IConfig, _elementRef: ElementRef, _renderer: Renderer2);
    applyMask(inputValue: string, maskExpression: string, position?: number, cb?: Function): string;
    applyValueChanges(position?: number, cb?: Function): void;
    hideInput(inputValue: string, maskExpression: string): string;
    getActualValue(res: string): string;
    shiftTypedSymbols(inputValue: string): string;
    showMaskInInput(inputVal?: string): string;
    clearIfNotMatchFn(): void;
    formElementProperty: [string, string | boolean];
    checkSpecialCharAmount(mask: string): number;
    private _checkForIp;
    private formControlResult;
    private _removeMask;
    private _removePrefix;
    private _removeSuffix;
    private _regExpForRemove;
    private _checkSymbols;
    private testFn;
    private _checkPrecision;
}
