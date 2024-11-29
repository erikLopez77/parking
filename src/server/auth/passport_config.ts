import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { AuthStore } from "./auth_types";
type Config = {
    jwt_secret: string,
    store: AuthStore
}
export const configurePassport = (config: Config) => {
    passport.use(new LocalStrategy(async (username, password, callback) => {
        if (await config.store.validateCredentials(username, password)) {
            // Devuelve un usuario con la propiedad 'role'
            const role = await config.store.isUser(username); // Método para obtener el rol
            return callback(null, { username, role }); // Incluye 'role'
        }
        return callback(null, false);
    }));

    passport.serializeUser((user, callback) => {
        callback(null, user); // Almacena todo el objeto usuario
    });

    passport.deserializeUser((user, callback) => {
        // Recupera el usuario como el tipo esperado
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


