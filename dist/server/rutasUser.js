"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFormRoutesUser = void 0;
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
    app.use(passport_1.default.authenticate("session"), (req, res, next) => {
        if (req.session.user) {
            req.authenticated = true; // Asignas el valor en req
            res.locals.user = req.session.user; // Pasas el usuario a res.locals
            res.locals.authenticated = true;
        }
        else {
            req.authenticated = false; // Asignas el valor en req
            res.locals.user = null;
            res.locals.authenticated = false;
        }
        next();
    });
    app.get("/politics", (req, res) => {
        res.render("politics");
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
    }), async (req, res, next) => {
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
                next();
            }
            else {
                // Si no es un usuario (es decir, es un administrador), redirigir a la interfaz de administrador
                res.render("menuAdmin");
                next();
            }
        }
        catch (error) {
            console.error("Error al verificar roles:", error);
            return res.status(500).send("Error en el servidor");
        }
    });
    app.get("/menu", (req, res) => {
        res.render("menu");
    });
    app.get("/menuUser", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (boolUser && authtenticated) {
            res.render("menuUser");
        }
        else {
            res.render("unauthorized");
        }
    });
    app.get("/myProfile", async (req, res) => {
        const username = req.session.user?.username; // Recupera el usuario de la sesión
        if (username) {
            const user = await store.getUser(username);
            res.render("myProfile", { user });
        }
        else {
            res.render("unauthorized");
        }
    });
    app.post("/myProfile", (req, res) => {
        res.render("updateProfile");
    });
    app.get("/updateProfile", (req, res) => {
        const authtenticated = req.authenticated;
        if (authtenticated) {
            res.render("updateProfile");
        }
        else {
            res.render("unauthorized");
        }
    });
    app.post("/updateProfile", (0, validation_1.validate)("name").required().minLength(2).isText(), (0, validation_1.validate)("lastname").required().isText().minLength(2), (0, validation_1.validate)("password").required(), (0, validation_1.validate)("email").required().isEmail(), (0, validation_1.validate)("card").required().minLength(16).maxLength(19), (0, validation_1.validate)("cvv").required().minLength(3).maxLength(4), (0, validation_1.validate)("expM").required().greaterThan(0).lessThan(13), (0, validation_1.validate)("expY").required().greaterThan(2024), (0, validation_1.validate)("cardholder").required().isText(), async (req, res) => {
        const validation = (0, validation_1.getValidationResults)(req);
        const current = req.session.user?.username;
        if (validation.valid && current) {
            try {
                const user = req.body;
                // Almacena el usuario en la base de datos usando `store`
                const model = await store.storeOrUpdateUser(user.name, user.lastname, current, user.password, user.email, user.card, user.cvv, user.expM, user.expY, user.cardholder); // Método ficticio, ajusta según tu implementación
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
    app.get("/saveUser", (req, res) => {
        res.render("saveUser");
    });
    app.post("/saveUser", (0, validation_1.validate)("name").required().minLength(2).isText(), (0, validation_1.validate)("lastname").required().isText().minLength(2), (0, validation_1.validate)("username").required(), (0, validation_1.validate)("password").required(), (0, validation_1.validate)("email").required().isEmail(), (0, validation_1.validate)("card").required().minLength(16).maxLength(19), (0, validation_1.validate)("cvv").required().minLength(3).maxLength(4), (0, validation_1.validate)("expM").required().greaterThan(0).lessThan(13), (0, validation_1.validate)("expY").required().greaterThan(2024), (0, validation_1.validate)("cardholder").required().isText(), async (req, res) => {
        const user = req.body.username;
        const userExists = await store.userExists(user);
        const validation = (0, validation_1.getValidationResults)(req);
        if (validation.valid && !userExists) {
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
    app.get("/reserve/:id", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (boolUser && authtenticated) {
            const { id } = req.params;
            const hoy = new Date().toISOString().split('T')[0]; // Obtener fecha actual en formato YYYY-MM-DD
            console.log(hoy);
            res.render("reserve", { id, hoy });
        }
        else {
            res.render("unauthorized");
        }
    });
    app.post("/reserve/:id", async (req, res) => {
        const { id } = req.params; // Recupera el parámetro id como cadena
        const numericId = parseInt(id, 10); // Convierte id a número base 10
        const fecha = req.body.date; // Asegúrate de extraer la propiedad `fecha` del body
        const username = req.session.user?.username; // Recupera el usuario de la sesión
        console.log("fecha", fecha, "username", username, "id", id);
        if (username) {
            try {
                const booking = await store.storeBookings(fecha, numericId, username);
                if (booking) {
                    res.status(201).send({ success: true, message: 'Reserva creada con éxito', booking });
                }
                else {
                    res.status(409).send({ success: false, message: 'Ya existe una reserva para esta fecha y lugar' });
                }
            }
            catch (error) {
                console.error('Error al crear la reserva:', error);
                res.status(500).send({ success: false, message: 'Error interno del servidor' });
            }
        }
    });
    app.get("/reservations", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (boolUser && authtenticated) {
            try {
                const username = req.session?.user?.username; // Asegúrate de que estás guardando el username en la sesión
                if (!username) {
                    return res.status(401).send({ success: false, message: "Usuario no autenticado" });
                }
                const bookingsR = await store.viewBookingsUser(username);
                console.log(bookingsR);
                res.render("reservations", { bookingsR });
            }
            catch (error) {
                console.error("Error al obtener las reservas:", error);
                res.status(500).send({ success: false, message: "Error interno del servidor" });
            }
        }
        else {
            res.render("unauthorized");
        }
    });
    app.delete("/cancel-reservation/:id", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (boolUser && authtenticated) {
            try {
                const { id } = req.params;
                const numericId = parseInt(id, 10);
                const { entry, exit, cost } = req.body;
                // Verifica que el lugar exista
                const place = await orm_auth_models_1.Place.findByPk(numericId);
                if (!place) {
                    return res.status(404).json({ success: false, message: "Lugar no encontrado." });
                }
                // Actualiza los datos del lugar
                await place.update({ entry, exit, cost });
                return res.status(200).json({ success: true, message: "Lugar actualizado exitosamente." });
            }
            catch (error) {
                console.error("Error al actualizar el lugar:", error);
                return res.status(500).json({ success: false, message: "Ocurrió un error en el servidor." });
            }
        }
        else {
            res.render("unauthorized");
        }
    });
    app.get("/unauthorized", async (req, resp) => {
        resp.render("unauthorized");
    });
    app.get('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('No se pudo cerrar la sesión');
            }
            res.redirect("/");
        });
    });
    //admins
    app.get("/allReservations", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (!boolUser && authtenticated) {
            const bookings = await store.viewBookings();
            console.log(bookings);
            res.render("allReservations", { bookings });
        }
        else {
            res.render("unauthorized");
        }
    });
    app.get("/menuAdmin", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (!boolUser && authtenticated) {
            res.render("menuAdmin");
        }
        else {
            res.render("unauthorized");
        }
    });
    app.get("/selectPlaces", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (!boolUser && authtenticated) {
            const places = await orm_auth_models_1.Place.findAll();
            const plainPlaces = places.map(place => place.get({ plain: true })); // Convertir a objetos planos
            res.render("selectPlaces", { places: plainPlaces }); // Pasar los objetos planos a la plantilla
        }
        else {
            res.render("unauthorized");
        }
    });
    //editar lugar
    app.get("/updatePlace/:id", async (req, res) => {
        try {
            const boolUser = req.session.user?.role;
            const authenticated = req.authenticated;
            if (!boolUser && authenticated) {
                const { id } = req.params; // Recupera el parámetro id como cadena
                const numericId = parseInt(id, 10);
                const place = await orm_auth_models_1.Place.findByPk(numericId); // Devuelve un solo lugar o null
                if (!place) {
                    return res.status(404).send("Lugar no encontrado.");
                }
                const plainPlace = place.get({ plain: true }); // Convertir el lugar a objeto plano
                return res.render("updatePlace", { place: plainPlace }); // Pasar el lugar a la plantilla
            }
            else {
                return res.render("unauthorized");
            }
        }
        catch (error) {
            console.error("Error al cargar el lugar:", error);
            return res.status(500).send("Ocurrió un error al cargar el lugar.");
        }
    });
    app.post("/updatePlace/:id", async (req, res) => {
        try {
            const { id } = req.params; // Recupera el parámetro id
            const numericId = parseInt(id, 10);
            const { entry, exit, cost } = req.body;
            console.log("Datos recibidos para actualizar:", { numericId, entry, exit, cost });
            const place = await store.updatePlace(numericId, entry, exit, cost); // Actualiza el lugar
            if (!place) {
                return res.status(404).json({ success: false, message: "Lugar no encontrado." });
            }
            return res.status(200).json({ success: true, message: "Lugar actualizado exitosamente." });
        }
        catch (error) {
            console.error("Error al actualizar el lugar:", error);
            return res.status(500).json({
                success: false,
                message: "Ocurrió un error al actualizar el lugar.",
            });
        }
    });
};
exports.registerFormRoutesUser = registerFormRoutesUser;
