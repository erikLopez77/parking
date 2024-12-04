import { Sequelize, Op, where } from "sequelize";
import { User, initializeAuthModels, RoleModel, Place, Booking }
    from "./orm_auth_models";
import { AuthStore, Role } from "./auth_types";
import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";
export class OrmAuthStore implements AuthStore {
    sequelize: Sequelize;
    constructor() {
        this.sequelize = new Sequelize({
            dialect: "sqlite",
            storage: "orm_auth.db",//db
            //logging: console.log,//consultas en la consola
            //logQueryParameters: true//muestra parametros de consultas en los log
        });
        this.initModelAndDatabase();
    }
    async initModelAndDatabase(): Promise<void> {
        initializeAuthModels(this.sequelize);
        await this.sequelize.drop();
        await this.sequelize.sync();
        await this.storeOrUpdateUser("Erik", "Espinosa Lopez",
            "ErikLopez", "1234", "espinozalopezerik@gmail.com");
        await this.storeOrUpdateUser("Alice", "Lance",
            "Alice", "mysecret", "alice@gmail.com",);
        await this.storeOrUpdateUser("Bob", "Peterson",
            "Bob", "mysecret", "bob@gmail.com");
        await this.storeOrUpdateRole({
            name: "Admins", members: ["ErikLopez", "Alice"]
        });
        await this.storeOrUpdateRole({
            name: "Users", members: ["Bob"]
        });
        await this.initPlaces();

    }
    async initPlaces(): Promise<void> {
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
            await this.storeOrUpdatePlace(
                place.suburb,
                place.street,
                place.numberS,
                place.cost
            );
        }
    }

    async getUser(username: string) {
        // Recupera credenciales buscando por su nombre de usuario
        const user: User | null = await User.findByPk(username);

        if (user) {
            // Convierte la instancia a un objeto plano
            return user.get({ plain: true });
        } else {
            return null;
        }
    }

    async userExists(username: string): Promise<boolean> {
        const userExists = await this.getUser(username); // Comprueba si el usuario existe.
        if (!userExists)
            return false;
        return true;
    }
    async getRoleMembers(roleName: string): Promise<string[]> {
        const role = await RoleModel.findOne({
            where: { name: roleName }, // Buscar el rol por su nombre
            include: [{ model: User, as: "CredentialsModels", attributes: ["username"] }] // Incluir los usuarios asociados
        });
        console.log("roles ", roleName, ": ", role);
        if (role) {
            // Extraer y devolver los nombres de usuario de los miembros
            return role.CredentialsModels?.map(user => user.username) ?? [];
        }
        return []; // Devolver una lista vacía si no se encuentra el rol
    }
    async storeOrUpdateUser(name: string, lastname: string, username: string, password: string, email: string) {
        const salt = randomBytes(16); //se genera salt
        const hashedPassword = await this.createHashCode(password, salt);//se hashea password
        const [model] = await User.upsert({
            name, lastname, username, hashedPassword, salt, email//inserta o actualiza usuario
        });
        return model; //modelo creado o actualizado
    }
    async validateCredentials(username: string, password: string):
        Promise<boolean> {
        const storedCreds = await this.getUser(username);//busca a usuario
        if (storedCreds) {
            const candidateHash =//calcula  nuevo codigo hash con contraseña candidata(escrita)
                await this.createHashCode(password, storedCreds.salt);
            //compara hash de forma segura
            return timingSafeEqual(candidateHash, storedCreds.hashedPassword);
        }//falso si no es valido
        return false;
    }//crea un codigo hash usando pbkdf
    private createHashCode(password: string, salt: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            //contraseña a codificar, salt, iteraciones,logitud, algoritmo
            pbkdf2(password, salt, 100000, 64, "sha512", (err, hash) => {
                if (err) {
                    reject(err)
                };
                resolve(hash);//devuelve hash generado
            })
        })
    }
    async isUser(username: string): Promise<boolean> {
        const roles = await this.getRolesForUser(username);
        console.log(roles);
        const isUser = roles.includes("Users");
        if (isUser)
            return true;
        return false;
    }

    async getRole(name: string) {
        const stored = await RoleModel.findByPk(name, {
            //datos asociados al modelo de credenciales, prop.del  modelo que se completarán en el resultado
            include: [{ model: User, attributes: ["username"] }]
        });
        if (stored) {
            return {//nombre del rol
                name: stored.name,
                //miembros de ese rol
                members: stored.CredentialsModels?.map(m => m.username) ?? []
            }
        }
        return null;
    }
    async getRolesForUser(username: string): Promise<string[]> {
        return (await RoleModel.findAll({
            //acepta role y consulta bd p/ objetos coincidentes
            include: [{//relación con role model
                model: User,//modelo con el que se tiene relación
                as: "CredentialsModels",//alias de la relación
                where: { username },//selección en funciónn a username
                attributes: []//no se recuperan las demas columnas
            }]
        })).map(rm => rm.name);
    }
    async storeOrUpdateRole(role: Role) {
        return await this.sequelize.transaction(async (transaction) => {
            //en la bd se busca user coincidentes en role.members

            const users = await User.findAll({
                //valores donde username está en rolemembers
                where: { username: { [Op.in]: role.members } },
                transaction//los datos no se pueden leer ni modificar  hasta confirmar transaction
            });//se crea o encuentra un rol cuyo name coincida con role.name
            console.log(users.map(m => m.name));
            const [rm] = await RoleModel.findOrCreate({
                //role.name está en tabla role model
                where: { name: role.name }, transaction
            });//establece asociación entre rol (rm) y usuarios
            await rm.setCredentialsModels(users, { transaction });
            console.log("\n\n");
            return role;
        });
    }//obtiene roles de un usuario y verifica que coincidan con un rol requerido
    async validateMembership(username: string, rolename: string) {
        //obtiene todos los roles del usuario con getRolesForUser, includes verifica si esta rolename
        return (await this.getRolesForUser(username)).includes(rolename);
    }

    //PLACES
    async storeOrUpdatePlace(suburb: string, street: string, numberS: number, cost: number) {
        await Place.findOrCreate({
            where: { suburb, street, numberS }, // Condiciones para buscar un lugar
            defaults: { suburb, street, numberS, cost }, // Valores para crear si no se encuentra
        });
    }
    async viewPlaces() {
        const places = await Place.findAll();
        console.log(places.map(p => p.suburb));
        return places;
    }

    async updatePlace(id: number, cost: number) {
        try {
            // Busca el lugar por id
            const place = await Place.findByPk(id);
            if (!place) {
                throw new Error(`No se encontró un lugar con el id ${id}`);
            }

            // Actualiza los campos necesarios
            await place.update({
                cost
            });

            console.log(`Lugar con id ${id} actualizado exitosamente.`);
            return place; // Devuelve el lugar actualizado si es necesario
        } catch (error) {
            console.error("Error al actualizar el lugar:", error);
            throw error;
        }
    }

    //BOOKINGS mio no toma en cuenta la hora
    /* async storeBookings(date: string, placeId: number, username: string, bEntry: string, bExit: string) {
        try {
            const [booking, created] = await Booking.findOrCreate({
                where: {
                    date: date,           // Fecha de la reserva
                    placePk: placeId,     // Id del lugar
                },
                defaults: {
                    userPk: username,     // Usuario (username de la tabla User)
                    date: date,           // Fecha de la reserva
                    placePk: placeId,
                    bEntry: bEntry,
                    bExit: bExit  // Lugar de la reserva
                },
            });

            if (created) {
                console.log(`Reserva creada exitosamente para el usuario ${username} en el lugar ${placeId} en la fecha ${date}.`);
                return booking; // Devuelve la reserva creada
            } else {
                console.log(`Ya existe una reserva para esta fecha y lugar.`);
                return null; // No se crea, ya existía
            }
        } catch (error) {
            console.error('Error al crear la reserva:', error);
            throw error;
        }
    } */

    async storeBookings(date: string, placeId: number, username: string, bEntry: string, bExit: string) {
        try {
            const overlappingBooking = await Booking.findOne({
                where: {
                    date: date,
                    placePk: placeId,
                    [Op.or]: [
                        {
                            bEntry: { [Op.lt]: bExit },
                            bExit: { [Op.gt]: bEntry }
                        },
                    ]
                }
            });

            if (overlappingBooking) {
                console.log(`Ya existe una reserva para este lugar en el horario solicitado.`);
                return null;
            }

            const booking = await Booking.create({
                userPk: username,
                date: date,
                placePk: placeId,
                bEntry: bEntry,
                bExit: bExit,
            });

            console.log(`Reserva creada exitosamente para el usuario ${username} en el lugar ${placeId} en la fecha ${date}.`);
            return booking;
        } catch (error) {
            console.error('Error al crear la reserva:', error);
            throw error;
        }
    }


    async viewBookings(): Promise<Record<string, any>[]> {
        const bookings = await Booking.findAll({
            include: [
                {
                    model: Place,
                    as: 'place',
                    attributes: ['suburb', 'entry', 'exit']
                }
            ]
        });
        return bookings.map(booking => booking.get({ plain: true }));
    }

    async viewBookingsUser(username: string): Promise<Record<string, any>[]> {
        const bookings = await Booking.findAll({
            where: { userPk: username }, // Filtrar por el usuario
            attributes: ['id', 'date', 'bEntry', 'bExit'], // Campos del modelo Booking
            include: [
                {
                    model: Place,
                    as: 'place',
                    attributes: ['suburb', 'cost'], // Campos específicos del modelo Place
                },
            ],
        });

        return bookings.map(booking => ({
            id: booking.id, // Incluye el id de la reserva
            ...booking.get({ plain: true }), // Incluye los atributos planos de la reserva
        }));
    }

    async deleteBooking(id: number): Promise<number> {
        const deletedRows = await Booking.destroy({
            where: { id }, // Elimina la reserva con el ID especificado
        });
        return deletedRows; // Retorna el número de filas eliminadas
    }

}