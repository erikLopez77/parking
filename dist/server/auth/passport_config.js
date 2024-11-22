"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const configurePassport = (config) => {
    passport_1.default.use(new passport_local_1.Strategy(async (username, password, callback) => {
        //se validan credenciales
        if (await config.store.validateCredentials(username, password)) {
            return callback(null, { username });
        } //devuelve objeto que representa usuario si pasa la verificación
        return callback(null, false);
        //es falso si falla la verificación
    }));
    ; //formato p/procesar
    passport_1.default.serializeUser((user, callback) => {
        callback(null, user);
    }); //formato entendible
    passport_1.default.deserializeUser((user, callback) => {
        callback(null, user);
    });
};
exports.configurePassport = configurePassport;
