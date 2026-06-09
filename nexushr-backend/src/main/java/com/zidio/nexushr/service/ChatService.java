package com.zidio.nexushr.service;

import com.zidio.nexushr.entity.ChatMessage;
import com.zidio.nexushr.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    /**
     * Saves a message and returns the saved entity, which includes the database-generated ID and timestamp.
     * This is transactional.
     * @param chatMessage The message to save.
     * @return The saved message with its ID.
     */
    @Transactional
    public ChatMessage saveMessage(ChatMessage chatMessage) {
        return chatMessageRepository.save(chatMessage);
    }

    /**
     * Deletes a message by its ID.
     * This is transactional.
     * @param messageId The ID of the message to delete.
     */
    @Transactional
    public void deleteMessage(Long messageId) {
        if (messageId != null) {
            chatMessageRepository.deleteById(messageId);
        }
    }
}