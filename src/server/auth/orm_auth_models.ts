import {
    DataTypes, InferAttributes, InferCreationAttributes, Model,
    Sequelize, HasManySetAssociationsMixin,
    DateOnlyDataType,
} from "sequelize";
import { user, Role, booking } from "./auth_types";
export class User extends Model<InferAttributes<User>,
    InferCreationAttributes<User>> implements user {
    declare name: string;
    declare lastname: string;
    declare username: string;
    declare hashedPassword: Buffer;
    declare salt: Buffer;
    declare email: string;
    declare card: string;
    declare cvv: number;
    declare expM: number;
    declare expY: number;
    declare cardholder: string;
    declare RoleModels?: InferAttributes<RoleModel>[];//array de  roleModel para tener relacion
}
export class Booking extends Model<InferAttributes<Booking>,
    InferAttributes<Booking>> implements booking {
    declare id?: number;
    declare date: string;
    declare userPk: string; // FK a User
    declare placePk: number; // FK a Place
}

export class Place extends Model<InferAttributes<Place>,
    InferAttributes<Place>> {
    declare id?: number;
    //declare picture: Buffer;
    declare entry: string;
    declare exit: string;
    declare suburb: string;
    declare street: string;
    declare numberS: number;
    declare cost: number;
}

//se representa un rol
export class RoleModel extends Model<InferAttributes<RoleModel>,
    //declare deine propiedades
    InferCreationAttributes<RoleModel>> {
    declare name: string;
    //credentialsModel es un arreglo de tipo crede.Models para tener relación, members
    declare CredentialsModels?: InferAttributes<User>[];
    declare setCredentialsModels://se configura con un roleModel
        HasManySetAssociationsMixin<User, string>;
}
export const initializeAuthModels = (sequelize: Sequelize) => {
    User.init({
        name: { type: DataTypes.STRING },
        lastname: { type: DataTypes.STRING },
        username: { type: DataTypes.STRING, primaryKey: true },
        //Blob permite cadenas o bufferes
        hashedPassword: { type: DataTypes.BLOB },
        salt: { type: DataTypes.BLOB },
        email: { type: DataTypes.STRING },
        card: { type: DataTypes.STRING },
        cvv: { type: DataTypes.NUMBER, validate: { min: 100, max: 999 } },
        expM: { type: DataTypes.NUMBER, validate: { min: 1, max: 12 } },
        expY: { type: DataTypes.NUMBER, validate: { min: 2024 } },
        cardholder: { type: DataTypes.STRING },
    }, { sequelize });

    RoleModel.init({
        name: { type: DataTypes.STRING, primaryKey: true },
    }, { sequelize });
    Booking.init({
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        date: { type: DataTypes.DATEONLY, allowNull: false },
        userPk: { type: DataTypes.STRING, allowNull: false },
        placePk: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        sequelize,
        timestamps: true
    });
    Place.init({
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        entry: { type: DataTypes.TIME },
        exit: { type: DataTypes.TIME },
        // picture: { type: DataTypes.BLOB },
        suburb: { type: DataTypes.STRING },
        street: { type: DataTypes.STRING },
        numberS: { type: DataTypes.NUMBER },
        cost: { type: DataTypes.NUMBER }
    }, { sequelize });

    RoleModel.belongsToMany(User,//name nombreRol
        //sequelize creará la tabla RoleMembershipJunction, p/crear union
        { through: "RoleMembershipJunction", foreignKey: "name", as: "CredentialsModels" });
    User.belongsToMany(RoleModel,//username es pk
        { through: "RoleMembershipJunction", foreignKey: "username", as: "Roles" });

    // Un User tiene una Booking
    User.hasMany(Booking, {
        foreignKey: 'userPk', // Nombre de la FK en Booking
        as: 'bookings',//alias p/relacion
    });

    // Una Booking pertenece a un User
    Booking.belongsTo(User, {
        foreignKey: 'userPk',
        as: 'user',
    });

    // Un Place tiene una Booking
    Place.hasMany(Booking, {
        foreignKey: 'placePk', // Nombre de la FK en Booking
        as: 'bookings',
    });

    // Una Booking pertenece a un Place
    Booking.belongsTo(Place, {
        foreignKey: 'placePk',
        as: 'place',
    });
}