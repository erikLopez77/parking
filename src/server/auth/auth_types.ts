import { Booking, Place } from "./orm_auth_models";

export interface user {
    name: string;
    lastname: string;
    username: string;
    hashedPassword: Buffer;
    salt: Buffer;
    email: string;
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
    storeOrUpdateUser(name: string, lastname: string, username: string, password: string, email: string): Promise<user>;
    validateCredentials(username: string, password: string): Promise<boolean>;
    isUser(username: string): Promise<boolean>;
    getRole(name: string): Promise<Role | null>;
    getRolesForUser(username: string): Promise<string[]>;
    storeOrUpdateRole(role: Role): Promise<Role>;
    validateMembership(username: string, role: string): Promise<boolean>;
    viewPlaces(): Promise<Place[]>;
    storeBookings(date: string, placeId: number, username: string, bEntry: string, bExit: string): Promise<Booking | null>;
    viewBookings(): Promise<booking[] | null>;
    viewBookingsUser(username: string): Promise<Record<string, any>[]>;
    deleteBooking(id: number): Promise<number>;
    updatePlace(id: number, cost: number): Promise<Place>
}
