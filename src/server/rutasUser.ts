import { Op } from "sequelize";
import { Express, NextFunction, Request, RequestHandler, Response } from "express";
import { AuthStore, booking } from "./auth/auth_types";
import { OrmAuthStore } from "./auth/orm_authstore";
import passport from "passport";
import { configurePassport, isAuthenticated } from "./auth/passport_config";
import { getValidationResults, validate } from "./validator/validation";
import { Place, Booking } from "./auth/orm_auth_models";

const jwt_secret = "mytokensecret";
const store: AuthStore = new OrmAuthStore();
//type User = { username: string }
//propiedad de nombre
declare module "express-session" {
    interface SessionData { user: { username: string; role: boolean } }
}//propiedades de usuario
declare global {
    module Express {
        // interface Request { user: User, authenticated: boolean }
        interface Request { feathers?: any, authenticated: boolean, user?: User; id?: number }// `user` se inyecta por Passport}
        interface User {
            username: string
            role: boolean
        }
    }
}

export const registerFormRoutesUser = (app: Express) => {
    configurePassport({ store, jwt_secret });
    //autentica solicitudes, sesion es la fuente de datos de autenticacion
    //passport busca a req.session
    app.use(passport.authenticate("session"), (req, resp, next) => {
        if (req.session.user) {
            resp.locals.user = req.session.user; // Pasa el usuario completo
            resp.locals.authenticated = true;
        } else {
            resp.locals.user = null;
            resp.locals.authenticated = false;
        }
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
        failureRedirect: "/loggin?failed=1",  // Caso fallido
    }), async (req, res) => {
        try {
            const username = req.body.username; // El nombre de usuario del usuario autenticado (esto depende de cómo hayas configurado passport)

            // Verificar si es un usuario normal o administrador
            const isUser = await store.isUser(username);  // Usamos tu función isUser aquí
            req.session.user = {
                username: username,
                role: isUser
            };

            console.log("isUser", isUser);
            if (isUser) {
                // Si es un usuario, redirigir a la interfaz de usuario
                res.render("menuUser",);
            } else {
                // Si no es un usuario (es decir, es un administrador), redirigir a la interfaz de administrador
                res.render("menuAdmin",);
            }
        } catch (error) {
            console.error("Error al verificar roles:", error);
            return res.status(500).send("Error en el servidor");
        }
    });
    app.get("/menu", (req, res) => {
        res.render("menu");
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
    app.get("/myProfile", async (req, res) => {
        const username: string | undefined = req.session.user?.username; // Recupera el usuario de la sesión
        if (username) {
            const user = await store.getUser(username);
            res.render("myProfile", { user });
        } else {
            res.status(401).send("Usuario no autenticado"); // Maneja el caso en el que no hay un usuario
        }
    });

    app.get("/saveUser", (req, res) => {
        res.render("saveUser");
    });
    app.post("/saveUser",
        validate("name").required().minLength(2).isText(),
        validate("lastname").required().isText().minLength(2),
        validate("username").required(),
        validate("password").required(),
        validate("email").required().isEmail(),
        validate("card").required().minLength(16).maxLength(19),
        validate("cvv").required().minLength(3).maxLength(4),
        validate("expM").required().greaterThan(0).lessThan(13),
        validate("expY").required().greaterThan(2024),
        validate("cardholder").required().isText(),
        async (req, res) => {
            const validation = getValidationResults(req);
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
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ success: false, message: "Error al registrar usuario." });
                }
            } else {
                res.status(400).json({ success: false, message: "Validación fallida, revisa bien la información" });
            }
        });
    app.get('/places', async (req, res) => {
        const places = await Place.findAll();
        const plainPlaces = places.map(place => place.get({ plain: true }));  // Convertir a objetos planos
        res.render("places", { places: plainPlaces }); // Pasar los objetos planos a la plantilla
    });

    app.get("/reserve/:id", async (req, res) => {
        const { id } = req.params;
        const hoy = new Date().toISOString().split('T')[0]; // Obtener fecha actual en formato YYYY-MM-DD
        console.log(hoy);
        res.render("reserve", { id, hoy });
    });
    app.post("/reserve/:id", async (req, res) => {
        const { id } = req.params; // Recupera el parámetro id como cadena
        const numericId = parseInt(id, 10); // Convierte id a número base 10

        const fecha = req.body.date; // Asegúrate de extraer la propiedad `fecha` del body
        const username: string | undefined = req.session.user?.username; // Recupera el usuario de la sesión
        console.log("fecha", fecha, "username", username, "id", id);
        if (username) {
            try {
                const booking = await store.storeBookings(fecha, numericId, username);
                if (booking) {
                    res.status(201).send({ success: true, message: 'Reserva creada con éxito', booking });
                } else {
                    res.status(409).send({ success: false, message: 'Ya existe una reserva para esta fecha y lugar' });
                }
            } catch (error) {
                console.error('Error al crear la reserva:', error);
                res.status(500).send({ success: false, message: 'Error interno del servidor' });
            }
        }
    });

    app.get("/reservations", async (req, res) => {
        try {
            const username = req.session?.user?.username; // Asegúrate de que estás guardando el username en la sesión
            if (!username) {
                return res.status(401).send({ success: false, message: "Usuario no autenticado" });
            }
            const bookingsR = await store.viewBookingsUser(username);
            res.render("reservations", { bookingsR });
        } catch (error) {
            console.error("Error al obtener las reservas:", error);
            res.status(500).send({ success: false, message: "Error interno del servidor" });
        }
    });
    app.delete("/cancel-reservation/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const deletedRows = await store.deleteBooking(Number(id));

            if (deletedRows > 0) {
                res.status(200).send({ success: true, message: "Reserva cancelada." });
            } else {
                res.status(404).send({ success: false, message: "Reserva no encontrada." });
            }
        } catch (error) {
            console.error("Error al cancelar la reserva:", error);
            res.status(500).send({ success: false, message: "Error interno del servidor." });
        }
    });

    app.get('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('No se pudo cerrar la sesión');
            }
            res.redirect("/");
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