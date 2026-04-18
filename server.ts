import { createServer } from 'http'
import next from 'next'
import { initDb } from './lib/db/client'
import { initScheduler } from './lib/scheduler/jobs'

const port = parseInt(process.env.PORT ?? '3009', 10)
const dev = process.env.NODE_ENV !== 'production'

const app = next({ dev, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  initDb()
  initScheduler()

  createServer((req, res) => {
    handle(req, res)
  }).listen(port, () => {
    console.log(`> Lumina ready on http://localhost:${port}/lumina (${dev ? 'development' : 'production'})`)
  })
})
