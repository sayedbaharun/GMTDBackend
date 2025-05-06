/**
 * Simple logger utility for consistent logging format
 * In a production environment, you would typically use a more robust logging solution
 */
export const logger = {
  info: (message: string, ...meta: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta);
  },
  
  error: (message: string | Error, ...meta: any[]) => {
    const errorMessage = message instanceof Error ? message.message : message;
    console.error(`[ERROR] ${new Date().toISOString()} - ${errorMessage}`, ...meta);
  },
  
  warn: (message: string, ...meta: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...meta);
  },
  
  debug: (message: string, ...meta: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...meta);
    }
  }
};
