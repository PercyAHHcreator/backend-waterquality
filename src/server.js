import http from 'http'
import express from 'express'
import socketIOClient from 'socket.io-client'
import { Server as ServerSocket } from 'socket.io'
import { constants, keys } from './config/index.js'

export class Server {
	#app
	#io

	constructor() {
		this.#app = http.createServer(express())
		this.setup()
	}

	setup() {
		this.configureSocket()
		this.applySocketEvents()
	}

	configureSocket() {
		this.#io = new ServerSocket(this.#app, {
			cors: {
				origin: '*',
			},
		})
	}

	applySocketEvents() {
		this.#io.on('connection', socket => {
			console.log(`Cliente conectado ${socket.id}`)

			const externalSocket = socketIOClient.connect(keys.EXTERNAL_SERVICE_URL, {
				query: {
					id: keys.EXTERNAL_SERVICE_USER_ID,
					moduleId: constants.MODULE_ID,
					sensorId: constants.SENSOR_ID,
				},
			})

			constants.EXTERNAL_SERVICE_ROUTES.forEach(route => {
				const eventName = `${constants.SENSOR_ID}/${route}`

				externalSocket.on(eventName, data => {
					socket.emit(eventName, data)
				})
			})

			socket.on('error', error => {
				console.error(error)
			})
		})
	}

	start() {
		this.#app.listen(keys.PORT, () => {
			console.log(`Servicio escuchando en el puerto ${keys.PORT}`)
		})
	}
}
