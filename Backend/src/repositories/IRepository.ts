export type id = string;

export interface IRepository <T> {
    create(element: T): Promise<id>;
    get(id: id): Promise<T>;
    getAll(): Promise<T[]>;
    update(element: T): Promise<void>;
    delete(id: id): Promise<void>;
}

export interface Initializable {
    init(): Promise<void>;
}