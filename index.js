require('dotenv').config()

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'

const app = require('./app')

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST} PORT: ${PORT}`)
})
