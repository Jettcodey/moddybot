declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      CLIENT_ID: string;
      GUILD_ID: string;
      WELCOME_CHANNEL_ID: string;
      CREATE_THREAD_ID: string;
      THREAD_CREATION_ALERT_ID: string;
      MINIMUM_ROLE_REQUIRED: string;
      ALERT_CHANNEL_ID: string;
    }
  }
}

export {};
