import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'https://databases-phrases-amd-recreational.trycloudflare.com/agent';

export const useAgentSocket = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeCustomers, setActiveCustomers] = useState([]);
    const socketRef = useRef(null);

    // Connect to socket
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('❌ No token found in localStorage');
            return;
        }

        // Initial connection
        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('✅ Agent Connected to Socket.IO');
            setIsConnected(true);
            // Immediately request customer list
            newSocket.emit('agent:get_customers');
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Agent Disconnected. Reason:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('🚫 Connection Error:', error.message);
            setIsConnected(false);
        });

        newSocket.on('agent:customers_list', (data) => {
            setActiveCustomers(data.customers);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Send Message
    const sendMessage = useCallback((customerUuid, message) => {
        if (socketRef.current) {
            socketRef.current.emit('agent:send_message', {
                customerUuid,
                message
            });
        }
    }, []);

    // Send Typing Indicator
    const sendTyping = useCallback((customerUuid, isTyping) => {
        if (socketRef.current) {
            socketRef.current.emit('agent:typing', {
                customerUuid,
                isTyping
            });
        }
    }, []);

    return {
        socket,
        isConnected,
        activeCustomers,
        sendMessage,
        sendTyping
    };
};
