package com.investa.repository;

import com.investa.model.Holding;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * MongoDB Repository for Holding operations
 * Provides database access methods
 */
@Repository
public interface HoldingRepository extends MongoRepository<Holding, String> {
    
    /**
     * Find all holdings for a specific user
     */
    List<Holding> findByUserIdOrderByCreatedAtDesc(String userId);
    
    /**
     * Find a holding by its ID and user ID
     */
    Optional<Holding> findByIdAndUserId(String id, String userId);
    
    /**
     * Find holdings by user ID and symbol
     */
    List<Holding> findByUserIdAndSymbol(String userId, String symbol);
    
    /**
     * Delete a holding by ID and user ID
     */
    void deleteByIdAndUserId(String id, String userId);
    
    /**
     * Count holdings for a user
     */
    long countByUserId(String userId);
    
    /**
     * Find all holdings with a specific symbol
     */
    List<Holding> findBySymbol(String symbol);
}
