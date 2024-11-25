import { NextFunction, Request, Response } from "express";
import validator from "validator";
type ValidatedRequest = Request & {
    validation: {
        results: {
            //campo a validar
            [key: string]: {
                //prueba:value
                [key: string]: boolean,
                valid: boolean
            }
        },//si todas las pruebas se pasaron
        valid: boolean
    }
}

export const validate = (propName: string) => {
    //record es un tipo clave:valor, y se declara vacío p/
    //mapa de funciones, regresa recibe val:string y devuelve un bool 
    const tests: Record<string, (val: string) => boolean> = {};
    //next se usa p/
    const handler = (req: Request, resp: Response, next: NextFunction) => {
        const vreq = req as ValidatedRequest;
        if (!vreq.validation) {
            vreq.validation = { results: {}, valid: true };
        }//se agrega una propiedad en results y se define como valid true
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
    }


    handler.required = () => {
        tests.required = (val: string) =>
            !validator.isEmpty(val, { ignore_whitespace: true });
        return handler;
    };
    handler.minLength = (min: number) => {  //min:min -> min:3
        tests.minLength = (val: string) => validator.isLength(val, { min });
        return handler;
    };
    handler.maxLength = (max: number) => {  //min:min -> min:3
        tests.maxLength = (val: string) => validator.isLength(val, { max });
        return handler;
    };
    handler.isNumber = () => {
        tests.isNumber = (val: string) =>
            /^[0-9]+$/.test(val);
        return handler;
    };
    handler.isInteger = () => {
        tests.isInteger = (val: string) => validator.isInt(val);
        return handler;
    };
    handler.isText = () => {
        tests.isText = (val: string) =>
            /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(val);
        return handler;
    };
    handler.isEmail = () => {
        tests.isEmail = (val: string) =>
            validator.isEmail(val);
        return handler;
    };
    handler.greaterThan = (n: number) => {
        tests.greaterThan = (val: string) => {
            const num = parseInt(val); // Convertir el valor a número
            return !isNaN(num) && num > n; // Validar rango
        };
        return handler;
    };
    handler.lessThan = (n: number) => {
        tests.lessThan = (val: string) => {
            const num = parseInt(val); // Convertir el valor a número
            return !isNaN(num) && num < n; // Validar rango
        };
        return handler;
    };

    return handler;
}
export const getValidationResults = (req: Request) => {
    //se accede a validation, si no existe valid, se le da la prop. valid=true
    return (req as ValidatedRequest).validation || { valid: true }
}