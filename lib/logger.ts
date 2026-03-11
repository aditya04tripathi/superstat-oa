const log = (
  level: string,
  color: string,
  message: string,
  ...args: unknown[]
) => {
  console.log(
    `%c[${level}]`,
    `color: ${color}; font-weight: bold;`,
    message,
    ...args
  )
}

export const info = (message: string, ...args: unknown[]) => {
  log("INFO", "blue", message, ...args)
}

export const success = (message: string, ...args: unknown[]) => {
  log("SUCCESS", "green", message, ...args)
}

export const warn = (message: string, ...args: unknown[]) => {
  log("WARN", "orange", message, ...args)
}

export const error = (message: string, ...args: unknown[]) => {
  log("ERROR", "red", message, ...args)
}

const logger = {
  info,
  success,
  warn,
  error,
}

export default logger
