"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = exports.registerFormRoutesUser = void 0;
const orm_authstore_1 = require("./auth/orm_authstore");
const passport_1 = __importDefault(require("passport"));
const passport_config_1 = require("./auth/passport_config");
const validation_1 = require("./validator/validation");
const jwt_secret = "mytokensecret";
const store = new orm_authstore_1.OrmAuthStore();
const registerFormRoutesUser = (app) => {
    (0, passport_config_1.configurePassport)({ store, jwt_secret });
    //autentica solicitudes, sesion es la fuente de datos de autenticacion
    //passport busca a req.session
    app.use(passport_1.default.authenticate("session"), (req, resp, next) => {
        resp.locals.user = req.user;
        resp.locals.authenticated
            = req.authenticated = req.user !== undefined;
        next();
    });
    app.get("/loggin", (req, res) => {
        const data = {
            failed: req.query["failed"] ? true : false,
            signinpage: true //metodo de representación del formulario
        };
        res.render("loggin", data); // Renderiza la plantilla `loggin.handlebars`
    });
    // Ruta POST para manejar el formulario enviado
    app.post("/loggin", passport_1.default.authenticate("local", {
        failureRedirect: `/loggin?failed=1`,
        successRedirect: "/menu" //caso de éxito
    }));
    app.get("/menu", passport_config_1.isAuthenticated, (req, res) => {
        // Verifica que el usuario esté autenticado antes de mostrar la página
        // if (req.isAuthenticated()) {
        res.render("menu", { user: req.user });
        // }
    });
    app.get("/saveUser", (req, res) => {
        res.render("saveUser");
    });
    app.post("/saveUser", (0, validation_1.validate)("name").required().minLength(2).isText(), (0, validation_1.validate)("lastname").required().isText().minLength(2), (0, validation_1.validate)("username").required(), (0, validation_1.validate)("password").required(), (0, validation_1.validate)("email").required().isEmail(), (0, validation_1.validate)("card").required().minLength(16).maxLength(19), (0, validation_1.validate)("cvv").required().minLength(3).maxLength(4), (0, validation_1.validate)("expM").required().greaterThan(0).lessThan(13), (0, validation_1.validate)("expY").required().greaterThan(2024), (0, validation_1.validate)("cardholder").required().isText(), async (req, res) => {
        const validation = (0, validation_1.getValidationResults)(req);
        if (validation.valid) {
            try {
                const user = req.body;
                // Almacena el usuario en la base de datos usando `store`
                const model = await store.storeOrUpdateUser(user.name, user.lastname, user.username, user.password, user.email, user.card, user.cvv, user.expM, user.expY, user.cardholder); // Método ficticio, ajusta según tu implementación
                console.log(model.username);
                await store.storeOrUpdateRole({
                    name: "Users", members: [model.username]
                });
                res.redirect("/loggin"); // Redirige al login después del registro
            }
            catch (error) {
                console.error(error);
                res.status(500).render("saveUser", { error: "Error al registrar usuario." });
            }
        }
        else {
            res.status(400).json({ success: false, message: "Validación fallida" });
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
};
exports.registerFormRoutesUser = registerFormRoutesUser;
//acepta rol y devuelve un componente middleware que pasará soli al controlador
//si el usuario está asignado a ese rol (validateMembership)
const roleGuard = (role) => {
    return async (req, resp, next) => {
        if (req.authenticated) { //verifica si el usuario está autenticado , authenticated está en passport
            const username = req.user?.username; //obtiene el nombre del ususario
            if (username != undefined
                //valida el username y el rol, vM en ormauthstore 
                && await store.validateMembership(username, role)) {
                next(); //si tiene el rol requerido, permite el acceso
                return;
            } //p/ soli autenticadas, pero no autorizadas
            resp.redirect("/unauthorized");
        }
        else { //en caso de no haber sido autenticado
            resp.redirect("/signin");
        }
    };
};
exports.roleGuard = roleGuard;
