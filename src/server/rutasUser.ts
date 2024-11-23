import { Express, NextFunction, RequestHandler } from "express";
import { AuthStore } from "./auth/auth_types";
import { OrmAuthStore } from "./auth/orm_authstore";
import passport from "passport";
import { configurePassport } from "./auth/passport_config";
import { log } from "console";

const jwt_secret = "mytokensecret";
const store: AuthStore = new OrmAuthStore();
//type User = { username: string }
//propiedad de nombre
declare module "express-session" {
    interface SessionData { username: string; }
}//propiedades de usuario
declare global {
    module Express {
        // interface Request { user: User, authenticated: boolean }
        interface Request { feathers?: any, authenticated: boolean }
        interface User {
            username: string
        }
    }
}

export const registerFormRoutesUser = (app: Express) => {
    configurePassport({ store, jwt_secret });
    //autentica solicitudes, sesion es la fuente de datos de autenticacion
    app.use(passport.authenticate("session"), (req, resp, next) => {
        resp.locals.user = req.user;
        resp.locals.authenticated
            = req.authenticated = req.user !== undefined;
        next();
    });
    app.get("/loggin", (req, res) => {
        const data = {
            failed: req.query["failed"] ? true : false,
            signinpage: true//metodo de representación del formulario
        }
        res.render("loggin", data); // Renderiza la plantilla `loggin.handlebars`
    });

    // Ruta POST para manejar el formulario enviado
    app.post("/loggin", passport.authenticate("local", {
        failureRedirect: `/loggin?failed=1`,//caso fallido
        successRedirect: "/menu"//caso de éxito
    }));

    app.get("/menu", (req, res) => {
        // Verifica que el usuario esté autenticado antes de mostrar la página
        if (req.isAuthenticated()) {
            res.render("menu", { user: req.user });
        }
    });
    app.get("/saveUser", (req, res) => {
        res.render("saveUser");
    });
    app.post("/saveUser", async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).render("saveUser", { error: "Todos los campos son obligatorios." });
        }
        try {
            // Almacena el usuario en la base de datos usando `store`
            const model = await store.storeOrUpdateUser(username, password); // Método ficticio, ajusta según tu implementación
            console.log(model.username);
            res.redirect("/loggin"); // Redirige al login después del registro
        } catch (error) {
            console.error(error);
            res.status(500).render("saveUser", { error: "Error al registrar usuario." });
        }
    });


}

//acepta rol y devuelve un componente middleware que pasará soli al controlador
//si el usuario está asignado a ese rol (validateMembership) en autorizaciones
/* export const roleGuard = (role: string)
    : RequestHandler<Request, Response, NextFunction>=> {
    return async (req, resp, next) => {
        if (req.authenticated) {
            const username = req.user?.username;
            if (username != undefined
                && await store.validateMembership(username, role)) {
                next();
                return;
            }//p/ soli autenticadas
            resp.redirect("/unauthorized");
        } else {//en caso de no haber sido autenticado
            resp.redirect("/signin");
        }
    }
} */

