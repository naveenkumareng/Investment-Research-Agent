package com.investa.repository;

import com.investa.model.Watchlist;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistRepository extends MongoRepository<Watchlist, String> {
    List<Watchlist> findByUserIdOrderByAddedAtDesc(String userId);
    Optional<Watchlist> findByUserIdAndSymbol(String userId, String symbol);
    void deleteByUserIdAndSymbol(String userId, String symbol);
}
