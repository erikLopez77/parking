"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuthModels = exports.RoleModel = exports.Place = exports.Booking = exports.User = void 0;
const sequelize_1 = require("sequelize");
class User extends sequelize_1.Model {
}
exports.User = User;
class Booking extends sequelize_1.Model {
}
exports.Booking = Booking;
class Place extends sequelize_1.Model {
}
exports.Place = Place;
//se representa un rol
class RoleModel extends sequelize_1.Model {
}
exports.RoleModel = RoleModel;
const initializeAuthModels = (sequelize) => {
    User.init({
        name: { type: sequelize_1.DataTypes.STRING },
        lastname: { type: sequelize_1.DataTypes.STRING },
        username: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
        //Blob permite cadenas o bufferes
        hashedPassword: { type: sequelize_1.DataTypes.BLOB },
        salt: { type: sequelize_1.DataTypes.BLOB },
        email: { type: sequelize_1.DataTypes.STRING },
        card: { type: sequelize_1.DataTypes.NUMBER },
        cvv: { type: sequelize_1.DataTypes.NUMBER, validate: { min: 100, max: 999 } },
        expM: { type: sequelize_1.DataTypes.NUMBER, validate: { min: 1, max: 12 } },
        expY: { type: sequelize_1.DataTypes.NUMBER, validate: { min: 2024 } },
        cardholder: { type: sequelize_1.DataTypes.STRING },
    }, { sequelize });
    RoleModel.init({
        name: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    }, { sequelize });
    Booking.init({
        id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        entry: { type: sequelize_1.DataTypes.DATE },
        exit: { type: sequelize_1.DataTypes.DATE },
        cost: { type: sequelize_1.DataTypes.NUMBER },
        userPk: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        placePk: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    }, {
        sequelize,
        timestamps: true
    });
    Place.init({
        id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        // picture: { type: DataTypes.BLOB },
        suburb: { type: sequelize_1.DataTypes.STRING },
        street: { type: sequelize_1.DataTypes.STRING },
        numberS: { type: sequelize_1.DataTypes.NUMBER },
        status: { type: sequelize_1.DataTypes.BOOLEAN },
        cost: { type: sequelize_1.DataTypes.NUMBER }
    }, { sequelize });
    RoleModel.belongsToMany(User, //name nombreRol
    //sequelize creará la tabla RoleMembershipJunction, p/crear union
    { through: "RoleMembershipJunction", foreignKey: "name", as: "CredentialsModels" });
    User.belongsToMany(RoleModel, //username es pk
    { through: "RoleMembershipJunction", foreignKey: "username", as: "Roles" });
    // Un User tiene una Booking
    User.hasMany(Booking, {
        foreignKey: 'userPk',
        as: 'bookings', //alias p/relacion
    });
    // Una Booking pertenece a un User
    Booking.belongsTo(User, {
        foreignKey: 'userPk',
        as: 'user',
    });
    // Un Place tiene una Booking
    Place.hasMany(Booking, {
        foreignKey: 'placePk',
        as: 'bookings',
    });
    // Una Booking pertenece a un Place
    Booking.belongsTo(Place, {
        foreignKey: 'placePk',
        as: 'place',
    });
};
exports.initializeAuthModels = initializeAuthModels;
