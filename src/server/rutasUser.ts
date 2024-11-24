import { Express, NextFunction, Request, RequestHandler, Response } from "express";
import { AuthStore } from "./auth/auth_types";
import { OrmAuthStore } from "./auth/orm_authstore";
import passport from "passport";
import { configurePassport, isAuthenticated } from "./auth/passport_config";
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
    //passport busca a req.session
    app.use(passport.authenticate("session"), (req, resp, next) => {
        resp.locals.user = req.user;
        resp.locals.authenticated
            = req.authenticated = req.user !== undefined;
        next();
    });
    /* function authorize(roles = []) {
        if (typeof roles === 'string') {
            roles = [roles];
        }
        return (req: any, res: any, next: any) => {
            if (!req.session.user || !roles.includes(req.locals.user.role)) {
                return res.status(403).send('No tienes permiso para acceder.');
            }
            next();
        };
    } */
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

    app.get("/menu", isAuthenticated, (req, res) => {
        // Verifica que el usuario esté autenticado antes de mostrar la página
        // if (req.isAuthenticated()) {
        res.render("menu", { user: req.user });
        // }
    });
    app.get("/saveUser", (req, res) => {
        res.render("saveUser");
    });
    app.post("/saveUser", async (req, res) => {
        const user = req.body;
        if (!user.username || !user.password) {
            return res.status(400).render("saveUser", { error: "Todos los campos son obligatorios." });
        }
        try {
            // Almacena el usuario en la base de datos usando `store`
            const model = await store.storeOrUpdateUser(user.name, user.lastname, user.username, user.password, user.email, user.card, user.cvv, user.expM, user.expY, user.cardholder); // Método ficticio, ajusta según tu implementación
            console.log(model.username);
            res.redirect("/loggin"); // Redirige al login después del registro
        } catch (error) {
            console.error(error);
            res.status(500).render("saveUser", { error: "Error al registrar usuario." });
        }
    });

    app.get('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('No se pudo cerrar la sesión');
            }
            res.send('Sesión cerrada exitosamente');
        });
    });
}

//acepta rol y devuelve un componente middleware que pasará soli al controlador
//si el usuario está asignado a ese rol (validateMembership)
export const roleGuard = (role: string)
    : RequestHandler<Request, Response, NextFunction> => {
    return async (req, resp, next) => {
        if (req.authenticated) {//verifica si el usuario está autenticado , authenticated está en passport
            const username = req.user?.username;//obtiene el nombre del ususario
            if (username != undefined
                //valida el username y el rol, vM en ormauthstore 
                && await store.validateMembership(username, role)) {
                next();//si tiene el rol requerido, permite el acceso
                return;
            }//p/ soli autenticadas, pero no autorizadas
            resp.redirect("/unauthorized");
        } else {//en caso de no haber sido autenticado
            resp.redirect("/signin");
        }
    }
}