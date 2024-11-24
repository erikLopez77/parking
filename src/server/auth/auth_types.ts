export interface user {
    name: string;
    lastname: string;
    username: string;
    hashedPassword: Buffer;
    salt: Buffer;
    email: string;
    card: number;
    cvv: number;
    expM: number;
    expY: number;
    cardholder: string;
}
export interface booking {
    entry: Date;
    id: Number;
    exit: Date;
    cost: number;
}
export interface Role {
    name: string;
    members: string[];
}
//interfcae p/ recuperar y almacenar credenciales
export interface AuthStore {
    getUser(name: string): Promise<user | null>;
    storeOrUpdateUser(name: string, lastname: string, username: string, password: string, email: string,
        card: number, cvv: number, expM: number, expY: number, cardholder: string):
        Promise<user>;
    validateCredentials(username: string, password: string): Promise<boolean>;
    getRole(name: string): Promise<Role | null>;
    getRolesForUser(username: string): Promise<string[]>;
    storeOrUpdateRole(role: Role): Promise<Role>;
    validateMembership(username: string, role: string): Promise<boolean>;
}
