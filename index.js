import WebSocket, { WebSocketServer } from 'ws'

const socketServer = new WebSocketServer({
	port: process.env.PORT || 3001,
})

const clientNames = new Map()

socketServer.on('error', console.error)
socketServer.on('listening', () => {
	console.log('listening on port %s', socketServer.options.port)
})

socketServer.on('connection', (socket) => {
	socket.on('error', console.error)
	socket.on('close', (code, reason) => {
		console.log('disconnected: %s', clientNames.get(socket))
		clientNames.delete(socket)
	})

	setTimeout(() => {
		if (!clientNames.has(socket)) {
			socket.close()
		}
	}, 5000)

	socket.on('message', (message, isBinary) => {
		if (!clientNames.has(socket)) {
			clientNames.set(socket, message.toString())
			console.log('connected: %s', clientNames.get(socket))
		} else {
			const clientName = clientNames.get(socket)
			console.log('received from %s: %s', clientName, message)
			socketServer.clients.forEach((client) => {
				if (client.readyState !== WebSocket.OPEN || client === socket) return
				if (message.includes('recipient')) {
					const json = JSON.parse(message)
					const recipient = json.recipient
					if (clientNames.get(client) !== recipient) return
					console.log('sending to %s: %s', recipient, message)
					client.send(message, { binary: isBinary })
				} else if (clientNames.get(client)?.split('_')[0] !== clientName?.split('_')[0]) {
					console.log('sending to %s: %s', clientNames.get(client), message)
					client.send(message, { binary: isBinary })
				}
			})
		}
	})
})
