import type { Client } from "discord.js"
import { getConfig, setConfig } from "@/utils/config.ts"

let intervalId: Timer | null = null

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]

async function getRandomActivity(client: Client) {
    const config = getConfig().status
    const user = await client.users.fetch(randomChoice(config.users))

    return { name: `${randomChoice(config.actions)} ${user?.globalName || user.username} ${randomChoice(config.suffixes)}` }
}

async function startRandom(client: Client, seconds?: number) {
    if (intervalId) { clearInterval(intervalId); intervalId = null }
    const config = getConfig()

    if (seconds) setConfig("status", { ...config.status, interval: seconds })
    const interval = seconds ?? config.status.interval

    const rotate = async () => {
        client.user?.setPresence({ status: "online", activities: [await getRandomActivity(client)] })
    }

    await rotate()
    intervalId = setInterval(rotate, interval * 1000)
}

function stopRandom() {
    if (intervalId) { clearInterval(intervalId); intervalId = null }
}

export { startRandom, stopRandom, getRandomActivity }
