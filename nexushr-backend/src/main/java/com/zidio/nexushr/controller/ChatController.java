package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.ChatMessage;
import com.zidio.nexushr.repository.ChatMessageRepository;
import com.zidio.nexushr.service.ChatService; // Import the new service
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatService chatService; 

    @Autowired
    private ChatMessageRepository chatMessageRepository; 

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // For dynamic channel routing

    @GetMapping("/history")
    public List<ChatMessage> getChatHistory() {
        return chatMessageRepository.findAll();
    }

    @PostMapping("/send")
    public ResponseEntity<ChatMessage> sendHttpMessage(@RequestBody ChatMessage chatMessage) {
        ChatMessage saved = chatService.saveMessage(chatMessage);
        String channel = saved.getDepartment();
        if (channel == null || channel.trim().isEmpty()) {
            channel = "General";
        }
        messagingTemplate.convertAndSend("/topic/chat/" + channel, saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/delete")
    public ResponseEntity<Map<String, Object>> deleteHttpMessage(@RequestBody Map<String, Object> payload) {
        Long messageId = null;
        Object idObj = payload.get("id");
        if (idObj instanceof Number) {
            messageId = ((Number) idObj).longValue();
        } else if (idObj instanceof String) {
            messageId = Long.parseLong((String) idObj);
        }

        if (messageId != null) {
            chatService.deleteMessage(messageId);
        }

        String channel = (String) payload.get("department");
        if (channel == null || channel.trim().isEmpty()) {
            channel = "General";
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", messageId);
        response.put("department", channel);

        messagingTemplate.convertAndSend("/topic/chat.delete/" + channel, response);
        return ResponseEntity.ok(response);
    }

    /**
     * Handles new messages and routes them to their specific department/channel topic dynamically.
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        // Save to database
        ChatMessage savedMessage = chatService.saveMessage(chatMessage);
        
        // Determine the target department channel
        String channel = savedMessage.getDepartment();
        if (channel == null || channel.trim().isEmpty()) {
            channel = "General";
        }
        
        // Broadcast dynamically to subscribers of this specific channel: /topic/chat/{channel}
        messagingTemplate.convertAndSend("/topic/chat/" + channel, savedMessage);
    }

    /**
     * Handles deleting/unsending a message. Matches the frontend destination "/app/chat.deleteMessage".
     */
    @MessageMapping("/chat.deleteMessage")
    public void deleteMessage(@Payload Map<String, Object> payload) {
        Long messageId = null;
        Object idObj = payload.get("id");
        if (idObj instanceof Number) {
            messageId = ((Number) idObj).longValue();
        } else if (idObj instanceof String) {
            messageId = Long.parseLong((String) idObj);
        }

        if (messageId != null) {
            chatService.deleteMessage(messageId);
        }

        String channel = (String) payload.get("department");
        if (channel == null || channel.trim().isEmpty()) {
            channel = "General";
        }

        // Broadcast the deleted message ID dynamically to subscribers: /topic/chat.delete/{channel}
        Map<String, Object> response = new HashMap<>();
        response.put("id", messageId);
        response.put("department", channel);

        messagingTemplate.convertAndSend("/topic/chat.delete/" + channel, response);
    }

    // Keep unsendMessage for backward compatibility just in case
    @MessageMapping("/chat.unsendMessage")
    public void unsendMessage(@Payload Map<String, Object> payload) {
        deleteMessage(payload);
    }
}