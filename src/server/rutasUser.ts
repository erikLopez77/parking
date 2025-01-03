
import { Express, NextFunction, Request, RequestHandler, Response } from "express";
import { AuthStore } from "./auth/auth_types";
import { OrmAuthStore } from "./auth/orm_authstore";
import passport from "passport";
import { configurePassport } from "./auth/passport_config";
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
    app.use(passport.authenticate("session"), (req, res, next) => {
        if (req.session.user) {
            req.authenticated = true; // Asignas el valor en req
            res.locals.user = req.session.user; // Pasas el usuario a res.locals
            res.locals.authenticated = true;
        } else {
            req.authenticated = false; // Asignas el valor en req
            res.locals.user = null;
            res.locals.authenticated = false;
        }
        next();
    });
    app.get("/politics", (req, res) => {
        res.render("politics");
    });
    app.delete("/deleteProfile/:username", async (req, res) => {
        const name = req.params.username;
        try {
            const resultado = await store.deleteUser(name);
            if (resultado) {
                console.log("Usuario eliminado exitosamente.");
                res.status(200).json({
                    success: true,
                    redirect: "/logout", // Indica al cliente a dónde redirigir
                });
            } else {
                console.log("No se pudo eliminar al usuario.");
                res.status(400).json({
                    success: false,
                    message: "No se pudo eliminar al usuario. Por favor, revisa los datos.",
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Error inesperado en el servidor. Por favor, inténtalo más tarde.",
            });
        }
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
    }), async (req, res, next) => {
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
                next();
            } else {
                // Si no es un usuario (es decir, es un administrador), redirigir a la interfaz de administrador
                res.render("menuAdmin",);
                next();
            }
        } catch (error) {
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
        } else {
            res.render("unauthorized");
        }
    });
    app.get("/myProfile", async (req, res) => {
        const username: string | undefined = req.session.user?.username; // Recupera el usuario de la sesión
        if (username) {
            const user = await store.getUser(username);
            res.render("myProfile", { user });
        } else {
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
        } else {
            res.render("unauthorized");
        }
    });
    app.post("/updateProfile", validate("name").required().minLength(2).isText(),
        validate("lastname").required().isText().minLength(2),
        validate("password").required(),
        validate("email").required().isEmail(),
        async (req, res) => {
            const validation = getValidationResults(req);
            const current = req.session.user?.username;
            if (validation.valid && current) {
                try {
                    const user = req.body;
                    console.log(user);
                    // Almacena el usuario en la base de datos usando `store`
                    const model = await store.storeOrUpdateUser(user.name, user.lastname, current, user.password, user.email); // Método ficticio, ajusta según tu implementación
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

    app.get("/saveUser", (req, res) => {
        res.render("saveUser");
    });
    app.post("/saveUser",
        validate("name").required().minLength(2).isText(),
        validate("lastname").required().isText().minLength(2),
        validate("username").required(),
        validate("password").required(),
        validate("email").required().isEmail(),
        async (req, res) => {
            const user = req.body.username;
            const userExists = await store.userExists(user);
            const validation = getValidationResults(req);
            if (validation.valid && !userExists) {
                try {
                    const user = req.body;
                    // Almacena el usuario en la base de datos usando `store`
                    const model = await store.storeOrUpdateUser(user.name, user.lastname, user.username, user.password, user.email); // Método ficticio, ajusta según tu implementación
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
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (boolUser && authtenticated) {
            const { id } = req.params;
            const hoy = new Date().toISOString().split('T')[0]; // Obtener fecha actual en formato YYYY-MM-DD
            console.log(hoy);
            const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')); // ["00", "01", ..., "23"]
            const minutes = ["00", "15", "30", "45"];

            res.render("reserve", { id, hoy, hours, minutes });
        } else {
            res.render("unauthorized");
        }
    });
    app.post("/reserve/:id", async (req, res) => {
        const { id } = req.params; // Recupera el parámetro id como cadena
        const numericId = parseInt(id, 10); // Convierte id a número base 10
        const result = req.body; // Asegúrate de extraer la propiedad `fecha` del body
        console.log(result);
        var h = result.bEntryH;
        var min = result.bEntryM;
        const bEntry = h + ":" + min;

        var he = result.bExitH;
        var mine = result.bExitM;
        const bExit = he + ":" + mine;
        const username: string | undefined = req.session.user?.username; // Recupera el usuario de la sesión
        console.log("fecha", result.date, "username", username, "id", id, bEntry, bExit);
        if (username && bEntry && result.date && bExit) {
            try {
                const booking = await store.storeBookings(result.date, numericId, username, bEntry, bExit);
                console.log(booking);
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
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (boolUser && authtenticated) {
            try {
                const username = req.session?.user?.username; // Asegúrate de que estás guardando el username en la sesión
                if (!username) {
                    return res.status(401).send({ success: false, message: "Usuario no autenticado" });
                }
                const bookingsR = await store.viewBookingsUser(username);
                console.log("bookings", bookingsR);
                res.render("reservations", { bookingsR });
            } catch (error) {
                console.error("Error al obtener las reservas:", error);
                res.status(500).send({ success: false, message: "Error interno del servidor" });
            }
        } else {
            res.render("unauthorized");
        }
    });

    app.post("/reservations/:id", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        const { id } = req.params; // Recupera el ID de los parámetros de la ruta
        if (boolUser && authtenticated) {
            try {
                const numericId = parseInt(id, 10); // Convierte a número
                if (isNaN(numericId)) {
                    return res.status(400).json({ success: false, message: "ID inválido" });
                }

                const deletedRows = await store.deleteBooking(numericId);
                if (deletedRows > 0) {
                    return res.status(200).json({ success: true, message: "Reserva cancelada con éxito." });
                } else {
                    return res.status(404).json({ success: false, message: "Reserva no encontrada." });
                }
            } catch (error) {
                console.error("Error al cancelar la reserva:", error);
                return res.status(500).json({ success: false, message: "Error interno del servidor" });
            }
        } else {
            res.status(403).json({ success: false, message: "No autorizado." });
        }
    });

    app.post("/booking/:id", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (boolUser && authtenticated) {
            try {
                const { id } = req.params;
                const numericId = parseInt(id, 10);
                const rows = await store.deleteBooking(numericId);
                console.log(rows);
                if (rows > 0) {
                    return res.status(404).json({ success: true, message: "Se borró reserva. " });
                }
                return res.status(200).json({ success: false, message: "No se logró borrar la reserva. " });
            } catch (error) {
                console.error("Error al tratar de eliminar reserva:", error);
                return res.status(500).json({ success: false, message: "Ocurrió un error en el servidor." });
            }
        } else {
            res.render("unauthorized");
        }
    });
    app.get("/unauthorized", async (req, resp) => {
        resp.render("unauthorized");
    });
    app.get("/entry/:id", async (req, res) => {
        const isUser = req.session.user?.role;
        const authenticated = req.authenticated;
        if (authenticated && isUser) {
            const { id } = req.params;
            const numericId = parseInt(id, 10);
            try {
                const plainBooking = await store.getBooking(numericId); // Obtén los datos
                if (plainBooking) {
                    console.log("Datos obtenidos: ", plainBooking);
                    res.render("entry", { plainBooking }); // Envíalos a la vista
                    /* res.render('entry', {
                        plainBooking: {
                            id: 1,
                            date: '2024-12-19',
                            place: { suburb: 'La Paz', street: 'Avenida Juárez', cost: 60, numberS: 202 },
                            bEntry: '12:00',
                            bExit: '14:00',
                        }
                    }); */

                } else {
                    res.status(404).render("not-found", { message: "Reserva no encontrada." });
                }
            } catch (error) {
                console.error("Error al obtener la reserva:", error);
                res.status(500).render("error", { message: "Error al procesar tu solicitud." });
            }
        } else {
            res.status(403).render("unauthorized");
        }
    });



    app.post("/entry/:id", async (req, res) => {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        const isUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        const booking: Booking | null = await Booking.findByPk(numericId, {
            attributes: ['date'],
        });
        /*  if (booking) {
             const plainBooking = booking.get({ plain: true });
             const bookingDate = new Date(plainBooking);
             const isSameDay = currentDate.toDateString() === bookingDate.toDateString();
         }
 
         // Asegurarse de que solo se compara la fecha, sin la hora
         if (authtenticated && isUser && isSameDay) {
             const booking = store.updateBookingWithCurrentTime(numericId);
             res.render("entry");
         } else {
             res.render("unauthorized");
         } */
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
        } else {
            res.render("unauthorized");
        }
    });
    app.get("/menuAdmin", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (!boolUser && authtenticated) {
            res.render("menuAdmin");
        } else {
            res.render("unauthorized");
        }
    });

    app.get("/selectPlaces", async (req, res) => {
        const boolUser = req.session.user?.role;
        const authtenticated = req.authenticated;
        if (!boolUser && authtenticated) {
            const places = await Place.findAll();
            const plainPlaces = places.map(place => place.get({ plain: true }));  // Convertir a objetos planos
            res.render("selectPlaces", { places: plainPlaces }); // Pasar los objetos planos a la plantilla
        } else {
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

                const place = await Place.findByPk(numericId); // Devuelve un solo lugar o null
                if (!place) {
                    return res.status(404).send("Lugar no encontrado.");
                }

                const plainPlace = place.get({ plain: true }); // Convertir el lugar a objeto plano
                return res.render("updatePlace", { place: plainPlace }); // Pasar el lugar a la plantilla
            } else {
                return res.render("unauthorized");
            }
        } catch (error) {
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

            const place = await store.updatePlace(numericId, cost); // Actualiza el lugar

            if (!place) {
                return res.status(404).json({ success: false, message: "Lugar no encontrado." });
            }

            return res.status(200).json({ success: true, message: "Lugar actualizado exitosamente." });
        } catch (error) {
            console.error("Error al actualizar el lugar:", error);
            return res.status(500).json({
                success: false,
                message: "Ocurrió un error al actualizar el lugar.",
            });
        }
    });

}
