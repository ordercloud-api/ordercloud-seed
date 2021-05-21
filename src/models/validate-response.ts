import SeedFile from "./seed-file";

export interface ValidateResponse {
    errors: string[];
    data: SeedFile;
}