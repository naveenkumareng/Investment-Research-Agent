package com.investa.repository;

import com.investa.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findByUserIdOrderByTimestampDesc(String userId);
    List<Transaction> findByUserIdAndSymbolOrderByTimestampDesc(String userId, String symbol);
}
