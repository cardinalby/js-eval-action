// @ts-check

Object.entries(
    dotenv.parse(fs.readFileSync(env.ENV_FILE).toString())
).forEach(
    e => core.exportVariable(e[0], e[1])
)