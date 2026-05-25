export interface Greeting {
    id?: string;
    userId: string;
    text: string;
    createdAt?: any;
}

export type CreateGreetingDTO = Omit<Greeting, 'id' | 'createdAt' | 'userId'>;
