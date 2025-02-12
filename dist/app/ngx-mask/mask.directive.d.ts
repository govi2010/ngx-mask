import { ControlValueAccessor, FormControl, ValidationErrors } from '@angular/forms';
import { CustomKeyboardEvent } from './custom-keyboard-event';
import { OnChanges, SimpleChanges } from '@angular/core';
import { IConfig } from './config';
import { MaskService } from './mask.service';
export declare class MaskDirective implements ControlValueAccessor, OnChanges {
    private document;
    private _maskService;
    protected _config: IConfig;
    maskExpression: string;
    specialCharacters: IConfig['specialCharacters'];
    patterns: IConfig['patterns'];
    prefix: IConfig['prefix'];
    suffix: IConfig['suffix'];
    dropSpecialCharacters: IConfig['dropSpecialCharacters'] | null;
    hiddenInput: IConfig['hiddenInput'] | null;
    showMaskTyped: IConfig['showMaskTyped'] | null;
    shownMaskExpression: IConfig['shownMaskExpression'] | null;
    showTemplate: IConfig['showTemplate'] | null;
    clearIfNotMatch: IConfig['clearIfNotMatch'] | null;
    validation: IConfig['validation'] | null;
    private _maskValue;
    private _inputValue;
    private _position;
    private _start;
    private _end;
    private _code;
    onChange: (_: any) => void;
    onTouch: () => void;
    constructor(document: any, _maskService: MaskService, _config: IConfig);
    ngOnChanges(changes: SimpleChanges): void;
    validate({ value }: FormControl): ValidationErrors | null;
    onInput(e: CustomKeyboardEvent): void;
    onBlur(): void;
    onFocus(e: MouseEvent | CustomKeyboardEvent): void;
    a(e: CustomKeyboardEvent): void;
    /** It writes the value in the input */
    writeValue(inputValue: string | number): Promise<void>;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    /** It disables the input element */
    setDisabledState(isDisabled: boolean): void;
    private _repeatPatternSymbols;
    private _applyMask;
}
