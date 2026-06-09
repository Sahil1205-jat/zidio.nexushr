package com.zidio.nexushr.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The endpoint for the frontend to connect to.
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns(
                    "http://localhost:[*]",
                    "https://nexushr-frontend.vercel.app",
                    "https://*.vercel.app"
                )
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for messages sent from the client to the server (e.g., /app/chat.sendMessage)
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix for messages broadcast from the server to the client (e.g., /topic/public)
        registry.enableSimpleBroker("/topic");
    }
}