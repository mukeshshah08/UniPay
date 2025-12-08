import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

export const useSocket = (merchantId, callbacks = {}) => {
  const socketRef = useRef(null)
  const callbacksRef = useRef(callbacks)

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    if (!merchantId) return

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      // Join merchant room
      socket.emit('join-merchant', merchantId)
      if (callbacksRef.current.onConnect) callbacksRef.current.onConnect()
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      if (callbacksRef.current.onDisconnect) callbacksRef.current.onDisconnect()
    })

    // Listen for payment events
    if (callbacksRef.current.onPaymentAuthorized) {
      socket.on('payment:authorized', callbacksRef.current.onPaymentAuthorized)
    }

    if (callbacksRef.current.onPaymentCaptured) {
      socket.on('payment:captured', callbacksRef.current.onPaymentCaptured)
    }

    if (callbacksRef.current.onPaymentRefunded) {
      socket.on('payment:refunded', callbacksRef.current.onPaymentRefunded)
    }

    if (callbacksRef.current.onPaymentFailed) {
      socket.on('payment:failed', callbacksRef.current.onPaymentFailed)
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.off('payment:authorized')
        socket.off('payment:captured')
        socket.off('payment:refunded')
        socket.off('payment:failed')
        socket.off('connect')
        socket.off('disconnect')
        socket.disconnect()
      }
    }
  }, [merchantId])

  return socketRef.current
}

