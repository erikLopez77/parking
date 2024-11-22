"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuthModels = exports.RoleModel = exports.CredentialsModel = void 0;
const sequelize_1 = require("sequelize");
class CredentialsModel extends sequelize_1.Model {
}
exports.CredentialsModel = CredentialsModel;
//se representa un rol
class RoleModel extends sequelize_1.Model {
}
exports.RoleModel = RoleModel;
const initializeAuthModels = (sequelize) => {
    CredentialsModel.init({
        username: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
        //Blob permite cadenas o bufferes
        hashedPassword: { type: sequelize_1.DataTypes.BLOB },
        salt: { type: sequelize_1.DataTypes.BLOB }
    }, { sequelize });
    RoleModel.init({
        name: { type: sequelize_1.DataTypes.STRING, primaryKey: true },
    }, { sequelize });
    RoleModel.belongsToMany(CredentialsModel, 
    //sequelize creará la tabla RoleMembershipJunction, p/crear union
    { through: "RoleMembershipJunction", foreignKey: "name" });
    CredentialsModel.belongsToMany(RoleModel, { through: "RoleMembershipJunction", foreignKey: "username" });
};
exports.initializeAuthModels = initializeAuthModels;
