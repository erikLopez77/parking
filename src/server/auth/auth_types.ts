import { Place } from "./orm_auth_models";

export interface user {
    name: string;
    lastname: string;
    username: string;
    hashedPassword: Buffer;
    salt: Buffer;
    email: string;
    card: string;
    cvv: number;
    expM: number;
    expY: number;
    cardholder: string;
}
export interface booking {
    id?: Number;
}
export interface Role {
    name: string;
    members: string[];
}
//interfcae p/ recuperar y almacenar credenciales
export interface AuthStore {
    getUser(name: string): Promise<user | null>;
    userExists(username: string): Promise<boolean>;
    getRoleMembers(roleName: string): Promise<string[]>;
    storeOrUpdateUser(name: string, lastname: string, username: string, password: string, email: string,
        card: string, cvv: number, expM: number, expY: number, cardholder: string):
        Promise<user>;
    validateCredentials(username: string, password: string): Promise<boolean>;
    isUser(username: string): Promise<boolean>;
    getRole(name: string): Promise<Role | null>;
    getRolesForUser(username: string): Promise<string[]>;
    storeOrUpdateRole(role: Role): Promise<Role>;
    validateMembership(username: string, role: string): Promise<boolean>;
    viewPlaces(): Promise<Place[]>;
}
