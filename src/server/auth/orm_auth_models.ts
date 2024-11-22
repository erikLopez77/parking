import {
    DataTypes, InferAttributes, InferCreationAttributes, Model,
    Sequelize, HasManySetAssociationsMixin
} from "sequelize";
import { Credentials, Role } from "./auth_types";
export class CredentialsModel extends Model <InferAttributes<CredentialsModel>,
    InferCreationAttributes<CredentialsModel>> implements Credentials{
        declare username: string;
        declare hashedPassword: Buffer;
        declare salt: Buffer;//array de  roleModel para tener relacion
        declare RoleModels?: InferAttributes<RoleModel>[];
    }
//se representa un rol
export class RoleModel extends Model<InferAttributes<RoleModel>,
    //declare deine propiedades
    InferCreationAttributes<RoleModel>> {
    declare name: string;
    //credentialsModel es un arreglo de tipo crede.Models para tener relación
    declare CredentialsModels?: InferAttributes<CredentialsModel>[];
    declare setCredentialsModels://se configura con un roleModel
        HasManySetAssociationsMixin<CredentialsModel, string>;
}
export const initializeAuthModels = (sequelize: Sequelize) => {
    CredentialsModel.init({
        username: { type: DataTypes.STRING, primaryKey: true },
        //Blob permite cadenas o bufferes
        hashedPassword: { type: DataTypes.BLOB },
        salt: { type: DataTypes.BLOB }
    }, { sequelize });
    RoleModel.init({
        name: { type: DataTypes.STRING, primaryKey: true },
    }, { sequelize });
    RoleModel.belongsToMany(CredentialsModel,
        //sequelize creará la tabla RoleMembershipJunction, p/crear union
        { through: "RoleMembershipJunction", foreignKey: "name" });
    CredentialsModel.belongsToMany(RoleModel,
        { through: "RoleMembershipJunction", foreignKey: "username" });
}