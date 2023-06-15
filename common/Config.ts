import * as dotenv from "dotenv";



export type SupportedDbType = 'postgres' | 'mariadb' | 'mysql' | 'sqlite';


export interface Config {

    app : {
        id: string;
        logLevel: string;
    };

    alchemy : {
        key: string;
        url: string;
        p_key: string;
    };

    token : {
        name: string;
        symbol: string;
        supply: number;
        name_AT: string;
        symbol_AT: string;
        supply_AT: number;
        system_wallet: string;
    }

    roles : {
        minter: string;
        burner: string;
        operator: string;
        admin: string;
    }

}

class EnvConfig implements Config {
    // leave the following line as the first initialization instruction in this
    // class, so the environment gets read before the other variables are initialized
    private __dotenv = dotenv.config();

    app = {
        id: this.getOrFail('APP_ID'),
        logLevel: this.getOrDefault('LOG_LEVEL', 'info'),
    };

    alchemy = {
        key: this.getOrFail('ALCHEMY_KEY'),
        url: this.getOrFail('ALCHEMY_HARDHAT_URL'),
        p_key: this.getOrFail('ALCHEMY_HARDHAT_KEY'),
    };

    token = {
        name: this.getOrFail('TOKEN_NAME'),
        symbol: this.getOrFail('TOKEN_SYMBOL'),
        supply: parseInt(this.getOrFail('TOKEN_SUPPLY')),
        name_AT: this.getOrFail('TOKEN_NAME_AT'),
        symbol_AT: this.getOrFail('TOKEN_SYMBOL_AT'),
        supply_AT: parseInt(this.getOrFail('TOKEN_SUPPLY_AT')),
        system_wallet: this.getOrFail('TOKEN_SYSTEM_WALLET')
    };

    roles = {
        minter: this.getOrFail('ROLES_MINTER'),
        burner: this.getOrFail('ROLES_BURNER'),
        operator: this.getOrFail('ROLES_OPERATOR'),
        admin: this.getOrFail('ROLES_DEFAULT_ADMIN'),
    };

    private getOrFail(key: string) {
        const val = process.env[key];
        if (!val) {
            throw new Error('Required environment variable is not set: ' + key);
        }
        return val;
    }

    private getOrDefault(key: string, defVal: string) {
        return process.env[key] ?? defVal;
    }

}

const config: Config = new EnvConfig();
export default config;
