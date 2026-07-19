package com.salesai.repository;

import com.salesai.entity.ChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {
    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(String userId);
    List<ChatSession> findByUserIdAndArchivedFalse(String userId);
    boolean existsByIdAndUserId(String id, String userId);
}
