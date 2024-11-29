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
const orm_auth_models_1 = require("./auth/orm_auth_models");
const jwt_secret = "mytokensecret";
const store = new orm_authstore_1.OrmAuthStore();
const registerFormRoutesUser = (app) => {
    (0, passport_config_1.configurePassport)({ store, jwt_secret });
    //autentica solicitudes, sesion es la fuente de datos de autenticacion
    //passport busca a req.session
    app.use(passport_1.default.authenticate("session"), (req, resp, next) => {
        if (req.session.user) {
            resp.locals.user = req.session.user; // Pasa el usuario completo
            resp.locals.authenticated = true;
        }
        else {
            resp.locals.user = null;
            resp.locals.authenticated = false;
        }
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
        failureRedirect: "/loggin?failed=1", // Caso fallido
    }), async (req, res) => {
        try {
            const username = req.body.username; // El nombre de usuario del usuario autenticado (esto depende de cómo hayas configurado passport)
            // Verificar si es un usuario normal o administrador
            const isUser = await store.isUser(username); // Usamos tu función isUser aquí
            req.session.user = {
                username: username,
                role: isUser
            };
            console.log("isUser", isUser);
            if (isUser) {
                // Si es un usuario, redirigir a la interfaz de usuario
                res.render("menuUser");
            }
            else {
                // Si no es un usuario (es decir, es un administrador), redirigir a la interfaz de administrador
                res.render("menuAdmin");
            }
        }
        catch (error) {
            console.error("Error al verificar roles:", error);
            return res.status(500).send("Error en el servidor");
        }
    });
    app.get("/menuAdmin", (req, res) => {
        // Verifica que el usuario esté autenticado antes de mostrar la página
        // if (req.isAuthenticated()) {
        //res.render("menuAdmin", { user: req.user });
        res.render("menuAdmin");
        // }
    });
    app.get("/menuUser", (req, res) => {
        // Verifica que el usuario esté autenticado antes de mostrar la página
        // if (req.isAuthenticated()) {
        //
        res.render("menuUser");
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
                const usersM = await store.getRoleMembers("Users");
                usersM.push(model.username);
                console.log(usersM);
                await store.storeOrUpdateRole({
                    name: "Users", members: usersM
                });
                res.status(200).json({ success: true });
                // res.json({ success: true, redirect: "/loggin" }); // Redirige al login después del registro
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: "Error al registrar usuario." });
            }
        }
        else {
            res.status(400).json({ success: false, message: "Validación fallida, revisa bien la información" });
        }
    });
    app.get('/places', async (req, res) => {
        const places = await orm_auth_models_1.Place.findAll();
        const plainPlaces = places.map(place => place.get({ plain: true })); // Convertir a objetos planos
        res.render("places", { places: plainPlaces }); // Pasar los objetos planos a la plantilla
    });
    /*  app.post('/reserve/:placeId', async (req, res) => {
         try {
             const { placeId } = req.params;
             const userPk = req.session.user?.username; // Supongamos que tienes un sistema de sesiones
 
             // Crea una reserva si el lugar está disponible
             const place = await Place.findByPk(placeId);
             if (!place || !place.status) {
                 return res.status(400).send({ success: false, message: 'Lugar no disponible' });
             }
 
             await Booking.create({
                 cost: place.cost,
                 userPk,
                 placePk: placeId,
             });
 
             res.send({ success: true });
         } catch (error) {
             console.error('Error al reservar lugar:', error);
             res.status(500).send({ success: false, message: 'Error interno del servidor' });
         }
     }); */
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
