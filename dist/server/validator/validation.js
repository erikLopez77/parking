"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidationResults = exports.validate = void 0;
const validator_1 = __importDefault(require("validator"));
const validate = (propName) => {
    //record es un tipo clave:valor, y se declara vacío p/
    //mapa de funciones, regresa recibe val:string y devuelve un bool 
    const tests = {};
    //next se usa p/
    const handler = (req, resp, next) => {
        const vreq = req;
        if (!vreq.validation) {
            vreq.validation = { results: {}, valid: true };
        } //se agrega una propiedad en results y se define como valid true
        vreq.validation.results[propName] = { valid: true };
        Object.keys(tests).forEach(k => {
            //se asigna el valor booleano
            let valid = vreq.validation.results[propName][k]
                = tests[k](req.body?.[propName]);
            //si una prueba es falsa
            if (!valid) {
                vreq.validation.results[propName].valid = false;
                vreq.validation.valid = false;
            }
        });
        next();
    };
    handler.required = () => {
        tests.required = (val) => !validator_1.default.isEmpty(val, { ignore_whitespace: true });
        return handler;
    };
    handler.minLength = (min) => {
        tests.minLength = (val) => validator_1.default.isLength(val, { min });
        return handler;
    };
    handler.maxLength = (max) => {
        tests.maxLength = (val) => validator_1.default.isLength(val, { max });
        return handler;
    };
    handler.isNumber = () => {
        tests.isNumber = (val) => /^[0-9]+$/.test(val);
        return handler;
    };
    handler.isInteger = () => {
        tests.isInteger = (val) => validator_1.default.isInt(val);
        return handler;
    };
    handler.isText = () => {
        tests.isText = (val) => /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(val);
        return handler;
    };
    handler.isEmail = () => {
        tests.isEmail = (val) => validator_1.default.isEmail(val);
        return handler;
    };
    handler.greaterThan = (n) => {
        tests.greaterThan = (val) => {
            const num = parseInt(val); // Convertir el valor a número
            return !isNaN(num) && num > n; // Validar rango
        };
        return handler;
    };
    handler.lessThan = (n) => {
        tests.lessThan = (val) => {
            const num = parseInt(val); // Convertir el valor a número
            return !isNaN(num) && num < n; // Validar rango
        };
        return handler;
    };
    return handler;
};
exports.validate = validate;
const getValidationResults = (req) => {
    //se accede a validation, si no existe valid, se le da la prop. valid=true
    return req.validation || { valid: true };
};
exports.getValidationResults = getValidationResults;
