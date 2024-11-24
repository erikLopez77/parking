import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { AuthStore } from "./auth_types";
type Config = {
    jwt_secret: string,
    store: AuthStore
}
export const configurePassport = (config: Config) => {
    passport.use(new LocalStrategy(async (username, password, callback) => {
        //se validan credenciales
        if (await config.store.validateCredentials(username, password)) {
            return callback(null, { username });
        }//devuelve objeto que representa usuario si pasa la verificación
        return callback(null, false);
        //es falso si falla la verificación
    }));
    ;//formato p/procesar
    passport.serializeUser((user, callback) => {
        callback(null, user);
    });//formato entendible
    passport.deserializeUser((user, callback) => {
        callback(null, user as Express.User);
    });
}
export function isAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) { // Passport agrega este método automáticamente
        return next();
    }
    res.redirect('/login'); // Si no está autenticado, lo rediriges al login
}

// Ejemplo de uso
/* app.get('/admin', authorize('admin'), (req, res) => {
    res.send('Panel de administración');
}); */


