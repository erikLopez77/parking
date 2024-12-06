"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrmAuthStore = void 0;
const sequelize_1 = require("sequelize");
const orm_auth_models_1 = require("./orm_auth_models");
const crypto_1 = require("crypto");
class OrmAuthStore {
    sequelize;
    constructor() {
        this.sequelize = new sequelize_1.Sequelize({
            dialect: "sqlite",
            storage: "orm_auth.db", //db
            //logging: console.log,//consultas en la consola
            //logQueryParameters: true//muestra parametros de consultas en los log
        });
        this.initModelAndDatabase();
    }
    async initModelAndDatabase() {
        (0, orm_auth_models_1.initializeAuthModels)(this.sequelize);
        await this.sequelize.drop();
        await this.sequelize.sync();
        await this.storeOrUpdateUser("Erik", "Espinosa Lopez", "ErikLopez", "1234", "espinozalopezerik@gmail.com");
        await this.storeOrUpdateUser("Alice", "Lance", "Alice", "mysecret", "alice@gmail.com");
        await this.storeOrUpdateUser("Bob", "Peterson", "Bob", "mysecret", "bob@gmail.com");
        await this.storeOrUpdateRole({
            name: "Admins", members: ["ErikLopez", "Alice"]
        });
        await this.storeOrUpdateRole({
            name: "Users", members: ["Bob"]
        });
        await this.initPlaces();
    }
    async initPlaces() {
        const places = [
            { suburb: "Centro", street: "16 de Septiembre", numberS: 101, cost: 50 },
            { suburb: "La Paz", street: "Avenida Juárez", numberS: 202, cost: 60 },
            { suburb: "Zavaleta", street: "Recta a Cholula", numberS: 303, cost: 55 },
            { suburb: "Angelópolis", street: "Blvd. del Niño Poblano", numberS: 404, cost: 70 },
            { suburb: "Centro", street: "5 de Mayo", numberS: 505, cost: 40 },
            { suburb: "San Manuel", street: "Circuito Juan Pablo II", numberS: 606, cost: 65 },
            { suburb: "Chapulco", street: "Blvd. Municipio Libre", numberS: 707, cost: 50 },
            { suburb: "Los Fuertes", street: "Av. Ejército de Oriente", numberS: 808, cost: 60 },
            { suburb: "Xilotzingo", street: "Blvd. Valsequillo", numberS: 909, cost: 55 },
            { suburb: "El Mirador", street: "Av. 11 Sur", numberS: 1001, cost: 45 },
            { suburb: "Analco", street: "2 Oriente", numberS: 150, cost: 35 },
            { suburb: "San Francisco", street: "4 Norte", numberS: 220, cost: 50 },
            { suburb: "El Carmen", street: "3 Poniente", numberS: 315, cost: 45 },
            { suburb: "Huexotitla", street: "31 Oriente", numberS: 412, cost: 60 },
            { suburb: "La Margarita", street: "Calle Margaritas", numberS: 523, cost: 40 },
        ];
        for (const place of places) {
            await this.storeOrUpdatePlace(place.suburb, place.street, place.numberS, place.cost);
        }
    }
    async getUser(username) {
        // Recupera credenciales buscando por su nombre de usuario
        const user = await orm_auth_models_1.User.findByPk(username);
        if (user) {
            // Convierte la instancia a un objeto plano
            return user.get({ plain: true });
        }
        else {
            return null;
        }
    }
    async userExists(username) {
        const userExists = await this.getUser(username); // Comprueba si el usuario existe.
        if (!userExists)
            return false;
        return true;
    }
    async getRoleMembers(roleName) {
        const role = await orm_auth_models_1.RoleModel.findOne({
            where: { name: roleName },
            include: [{ model: orm_auth_models_1.User, as: "CredentialsModels", attributes: ["username"] }] // Incluir los usuarios asociados
        });
        console.log("roles ", roleName, ": ", role);
        if (role) {
            // Extraer y devolver los nombres de usuario de los miembros
            return role.CredentialsModels?.map(user => user.username) ?? [];
        }
        return []; // Devolver una lista vacía si no se encuentra el rol
    }
    async storeOrUpdateUser(name, lastname, username, password, email) {
        const salt = (0, crypto_1.randomBytes)(16); //se genera salt
        const hashedPassword = await this.createHashCode(password, salt); //se hashea password
        const [model] = await orm_auth_models_1.User.upsert({
            name, lastname, username, hashedPassword, salt, email //inserta o actualiza usuario
        });
        return model; //modelo creado o actualizado
    }
    async validateCredentials(username, password) {
        const storedCreds = await this.getUser(username); //busca a usuario
        if (storedCreds) {
            const candidateHash = //calcula  nuevo codigo hash con contraseña candidata(escrita)
             await this.createHashCode(password, storedCreds.salt);
            //compara hash de forma segura
            return (0, crypto_1.timingSafeEqual)(candidateHash, storedCreds.hashedPassword);
        } //falso si no es valido
        return false;
    } //crea un codigo hash usando pbkdf
    createHashCode(password, salt) {
        return new Promise((resolve, reject) => {
            //contraseña a codificar, salt, iteraciones,logitud, algoritmo
            (0, crypto_1.pbkdf2)(password, salt, 100000, 64, "sha512", (err, hash) => {
                if (err) {
                    reject(err);
                }
                ;
                resolve(hash); //devuelve hash generado
            });
        });
    }
    async deleteUser(username) {
        try {
            const eliminado = await orm_auth_models_1.User.destroy({
                where: { username: username },
            });
            return eliminado > 0; // Retorna `true` si se eliminó al menos un registro, de lo contrario `false`.
        }
        catch (error) {
            console.error("Error al eliminar el usuario:", error);
            return false; // Devuelve `false` en caso de error.
        }
    }
    async isUser(username) {
        const roles = await this.getRolesForUser(username);
        console.log(roles);
        const isUser = roles.includes("Users");
        if (isUser)
            return true;
        return false;
    }
    async getRole(name) {
        const stored = await orm_auth_models_1.RoleModel.findByPk(name, {
            //datos asociados al modelo de credenciales, prop.del  modelo que se completarán en el resultado
            include: [{ model: orm_auth_models_1.User, attributes: ["username"] }]
        });
        if (stored) {
            return {
                name: stored.name,
                //miembros de ese rol
                members: stored.CredentialsModels?.map(m => m.username) ?? []
            };
        }
        return null;
    }
    async getRolesForUser(username) {
        return (await orm_auth_models_1.RoleModel.findAll({
            //acepta role y consulta bd p/ objetos coincidentes
            include: [{
                    model: orm_auth_models_1.User,
                    as: "CredentialsModels",
                    where: { username },
                    attributes: [] //no se recuperan las demas columnas
                }]
        })).map(rm => rm.name);
    }
    async storeOrUpdateRole(role) {
        return await this.sequelize.transaction(async (transaction) => {
            //en la bd se busca user coincidentes en role.members
            const users = await orm_auth_models_1.User.findAll({
                //valores donde username está en rolemembers
                where: { username: { [sequelize_1.Op.in]: role.members } },
                transaction //los datos no se pueden leer ni modificar  hasta confirmar transaction
            }); //se crea o encuentra un rol cuyo name coincida con role.name
            console.log(users.map(m => m.name));
            const [rm] = await orm_auth_models_1.RoleModel.findOrCreate({
                //role.name está en tabla role model
                where: { name: role.name }, transaction
            }); //establece asociación entre rol (rm) y usuarios
            await rm.setCredentialsModels(users, { transaction });
            console.log("\n\n");
            return role;
        });
    } //obtiene roles de un usuario y verifica que coincidan con un rol requerido
    async validateMembership(username, rolename) {
        //obtiene todos los roles del usuario con getRolesForUser, includes verifica si esta rolename
        return (await this.getRolesForUser(username)).includes(rolename);
    }
    //PLACES
    async storeOrUpdatePlace(suburb, street, numberS, cost) {
        await orm_auth_models_1.Place.findOrCreate({
            where: { suburb, street, numberS },
            defaults: { suburb, street, numberS, cost }, // Valores para crear si no se encuentra
        });
    }
    async viewPlaces() {
        const places = await orm_auth_models_1.Place.findAll();
        console.log(places.map(p => p.suburb));
        return places;
    }
    async updatePlace(id, cost) {
        try {
            // Busca el lugar por id
            const place = await orm_auth_models_1.Place.findByPk(id);
            if (!place) {
                throw new Error(`No se encontró un lugar con el id ${id}`);
            }
            // Actualiza los campos necesarios
            await place.update({
                cost
            });
            console.log(`Lugar con id ${id} actualizado exitosamente.`);
            return place; // Devuelve el lugar actualizado si es necesario
        }
        catch (error) {
            console.error("Error al actualizar el lugar:", error);
            throw error;
        }
    }
    //BOOKINGS mio no toma en cuenta la hora
    async storeBookings(date, placeId, username, bEntry, bExit) {
        try {
            const overlappingBooking = await orm_auth_models_1.Booking.findOne({
                where: {
                    date: date,
                    placePk: placeId,
                    [sequelize_1.Op.or]: [
                        {
                            bEntry: { [sequelize_1.Op.lt]: bExit },
                            bExit: { [sequelize_1.Op.gt]: bEntry }
                        },
                    ]
                }
            });
            if (overlappingBooking) {
                console.log(`Ya existe una reserva para este lugar en el horario solicitado.`);
                return null;
            }
            const booking = await orm_auth_models_1.Booking.create({
                userPk: username,
                date: date,
                placePk: placeId,
                bEntry: bEntry,
                bExit: bExit,
            });
            console.log(`Reserva creada exitosamente para el usuario ${username} en el lugar ${placeId} en la fecha ${date}.`);
            return booking;
        }
        catch (error) {
            console.error('Error al crear la reserva:', error);
            throw error;
        }
    }
    async viewBookings() {
        const bookings = await orm_auth_models_1.Booking.findAll({
            include: [
                {
                    model: orm_auth_models_1.Place,
                    as: 'place',
                    attributes: ['suburb', 'entry', 'exit']
                }
            ]
        });
        return bookings.map(booking => booking.get({ plain: true }));
    }
    async viewBookingsUser(username) {
        const bookings = await orm_auth_models_1.Booking.findAll({
            where: { userPk: username },
            attributes: ['id', 'date', 'bEntry', 'bExit'],
            include: [
                {
                    model: orm_auth_models_1.Place,
                    as: 'place',
                    attributes: ['suburb', 'cost'], // Campos específicos del modelo Place
                },
            ],
        });
        return bookings.map(booking => ({
            id: booking.id,
            ...booking.get({ plain: true }), // Incluye los atributos planos de la reserva
        }));
    }
    async updateBookingWithCurrentTime(bookingId) {
        // Obtener la reserva
        const booking = await orm_auth_models_1.Booking.findByPk(bookingId, {
            attributes: ['bEntry', 'rEntry'],
        });
        if (!booking) {
            throw new Error("Reserva no encontrada");
            return false;
        }
        // Obtener la fecha actual y la fecha de la entrada planificada (bEntry)
        const currentDate = new Date();
        const bookingDate = new Date(booking.date);
        // Asegurarse de que solo se compara la fecha, sin la hora
        const isSameDay = currentDate.toDateString() === bookingDate.toDateString();
        if (!isSameDay) {
            throw new Error("La reserva no es para el día de hoy.");
            return false;
        }
        // Comparar las horas de entrada (rEntry y bEntry) para ver si la diferencia es mayor a 10 minutos
        const bEntryTime = new Date(booking.bEntry).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = Math.abs(currentTime - bEntryTime); // Diferencia en milisegundos
        // 10 minutos en milisegundos
        const maxTimeDifference = 10 * 60 * 1000;
        if (timeDifference > maxTimeDifference) {
            throw new Error("No puedes actualizar la entrada con más de 10 minutos de diferencia.");
            return false;
        }
        // Si pasa todas las validaciones, actualizamos rEntry con la hora actual
        await orm_auth_models_1.Booking.update({ rEntry: currentDate.toISOString() }, { where: { id: bookingId } });
        return true;
    }
    async deleteBooking(id) {
        if (!id || isNaN(id)) {
            throw new Error("ID inválido");
        }
        const deletedRows = await orm_auth_models_1.Booking.destroy({
            where: { id }, // Elimina la reserva con el ID especificado
        });
        return deletedRows; // Retorna el número de filas eliminadas
    }
    async getBooking(id) {
        const booking = await orm_auth_models_1.Booking.findByPk(id, {
            include: [
                {
                    model: orm_auth_models_1.Place,
                    as: 'place',
                    attributes: ['suburb', 'street', 'cost', 'numberS'], // Ajusta los campos según tu esquema
                },
            ],
        });
        if (booking) {
            const plainBooking = booking.get({ plain: true });
            // Retornar la información que necesitas
            return plainBooking;
            // Salida
        }
        throw new Error('Booking not found');
    }
}
exports.OrmAuthStore = OrmAuthStore;
