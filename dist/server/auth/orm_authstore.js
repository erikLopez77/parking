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
        await this.storeOrUpdateUser("Erik", "Espinosa Lopez", "ErikLopez", "1234", "espinozalopezerik@gmail.com", "55799123412341234", 123, 10, 2031, "Erik Lopez");
        await this.storeOrUpdateUser("Alice", "Lance", "alice", "mysecret", "alice@gmail.com", "5579111122223333", 113, 10, 2031, "Alice Lance");
        await this.storeOrUpdateUser("Bob", "Peterson", "bob", "mysecret", "bob@gmail.com", "5579444433332222", 321, 8, 2030, "Bob Peterson");
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
            { entry: "08:00", exit: "18:00", suburb: "Centro", street: "16 de Septiembre", numberS: 101, cost: 50 },
            { entry: "07:00", exit: "19:00", suburb: "La Paz", street: "Avenida Juárez", numberS: 202, cost: 60 },
            { entry: "09:00", exit: "17:00", suburb: "Zavaleta", street: "Recta a Cholula", numberS: 303, cost: 55 },
            { entry: "10:00", exit: "20:00", suburb: "Angelópolis", street: "Blvd. del Niño Poblano", numberS: 404, cost: 70 },
            { entry: "06:30", exit: "15:30", suburb: "Centro", street: "5 de Mayo", numberS: 505, cost: 40 },
            { entry: "08:15", exit: "18:45", suburb: "San Manuel", street: "Circuito Juan Pablo II", numberS: 606, cost: 65 },
            { entry: "07:30", exit: "16:30", suburb: "Chapulco", street: "Blvd. Municipio Libre", numberS: 707, cost: 50 },
            { entry: "09:45", exit: "18:15", suburb: "Los Fuertes", street: "Av. Ejército de Oriente", numberS: 808, cost: 60 },
            { entry: "10:30", exit: "19:30", suburb: "Xilotzingo", street: "Blvd. Valsequillo", numberS: 909, cost: 55 },
            { entry: "07:00", exit: "20:00", suburb: "El Mirador", street: "Av. 11 Sur", numberS: 1001, cost: 45 },
            { entry: "06:00", exit: "14:00", suburb: "Analco", street: "2 Oriente", numberS: 150, cost: 35 },
            { entry: "08:30", exit: "18:00", suburb: "San Francisco", street: "4 Norte", numberS: 220, cost: 50 },
            { entry: "07:00", exit: "19:00", suburb: "El Carmen", street: "3 Poniente", numberS: 315, cost: 45 },
            { entry: "09:00", exit: "17:30", suburb: "Huexotitla", street: "31 Oriente", numberS: 412, cost: 60 },
            { entry: "07:45", exit: "20:00", suburb: "La Margarita", street: "Calle Margaritas", numberS: 523, cost: 40 },
        ];
        for (const place of places) {
            await this.storeOrUpdatePlace(place.entry, place.exit, place.suburb, place.street, place.numberS, place.cost);
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
    async storeOrUpdateUser(name, lastname, username, password, email, card, cvv, expM, expY, cardholder) {
        const salt = (0, crypto_1.randomBytes)(16); //se genera salt
        const hashedPassword = await this.createHashCode(password, salt); //se hashea password
        const [model] = await orm_auth_models_1.User.upsert({
            name, lastname, username, hashedPassword, salt, email, card, cvv, expM, expY, cardholder //inserta o actualiza usuario
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
    async storeOrUpdatePlace(entry, exit, suburb, street, numberS, cost) {
        await orm_auth_models_1.Place.findOrCreate({
            where: { suburb, street, numberS },
            defaults: { entry, exit, suburb, street, numberS, cost }, // Valores para crear si no se encuentra
        });
    }
    async viewPlaces() {
        const places = await orm_auth_models_1.Place.findAll();
        console.log(places.map(p => p.suburb));
        return places;
    }
    //BOOKINGS
    async storeBookings(date, placeId, username) {
        try {
            const [booking, created] = await orm_auth_models_1.Booking.findOrCreate({
                where: {
                    date: date,
                    placePk: placeId, // Id del lugar
                },
                defaults: {
                    userPk: username,
                    date: date,
                    placePk: placeId, // Lugar de la reserva
                },
            });
            if (created) {
                console.log(`Reserva creada exitosamente para el usuario ${username} en el lugar ${placeId} en la fecha ${date}.`);
                return booking; // Devuelve la reserva creada
            }
            else {
                console.log(`Ya existe una reserva para esta fecha y lugar.`);
                return null; // No se crea, ya existía
            }
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
            attributes: ['id', 'date'],
            include: [
                {
                    model: orm_auth_models_1.Place,
                    as: 'place',
                    attributes: ['suburb', 'entry', 'exit'], // Campos específicos del modelo Place
                },
            ],
        });
        return bookings.map(booking => ({
            id: booking.id,
            ...booking.get({ plain: true }), // Incluye los atributos planos de la reserva
        }));
    }
    async deleteBooking(id) {
        const deletedRows = await orm_auth_models_1.Booking.destroy({
            where: { id }, // Elimina la reserva con el ID especificado
        });
        return deletedRows; // Retorna el número de filas eliminadas
    }
}
exports.OrmAuthStore = OrmAuthStore;
