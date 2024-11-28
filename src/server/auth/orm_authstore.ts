import { Sequelize, Op } from "sequelize";
import { User, initializeAuthModels, RoleModel }
    from "./orm_auth_models";
import { AuthStore, Role } from "./auth_types";
import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";
export class OrmAuthStore implements AuthStore {
    sequelize: Sequelize;
    constructor() {
        this.sequelize = new Sequelize({
            dialect: "sqlite",
            storage: "orm_auth.db",//db
            logging: console.log,//consultas en la consola
            logQueryParameters: true//muestra parametros de consultas en los log
        });
        this.initModelAndDatabase();
    }
    async initModelAndDatabase(): Promise<void> {
        initializeAuthModels(this.sequelize);
        await this.sequelize.drop();
        await this.sequelize.sync();
        await this.storeOrUpdateUser("Erik", "Espinosa Lopez",
            "ErikLopez", "1234", "espinozalopezerik@gmail.com", "55799123412341234", 123, 10, 2031, "Erik Lopez");
        await this.storeOrUpdateUser("Alice", "Lance",
            "alice", "mysecret", "alice@gmail.com", "5579111122223333", 113, 10, 2031, "Alice Lance");
        await this.storeOrUpdateUser("Bob", "Peterson",
            "bob", "mysecret", "bob@gmail.com", "5579444433332222", 321, 8, 2030, "Bob Peterson");
        await this.storeOrUpdateRole({
            name: "Admins", members: ["ErikLopez", "alice"]
        });
        await this.storeOrUpdateRole({
            name: "Users", members: ["bob"]
        });
    }
    async getUser(username: string) {//recupera credenciales buscando por su nombre
        return await User.findByPk(username);
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

    async storeOrUpdateUser(name: string, lastname: string, username: string, password: string, email: string, card: string, cvv: number, expM: number, expY: number, cardholder: string) {
        const salt = randomBytes(16); //se genera salt
        const hashedPassword = await this.createHashCode(password, salt);//se hashea password
        const [model] = await User.upsert({
            name, lastname, username, hashedPassword, salt, email, card, cvv, expM, expY, cardholder//inserta o actualiza usuario
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
}