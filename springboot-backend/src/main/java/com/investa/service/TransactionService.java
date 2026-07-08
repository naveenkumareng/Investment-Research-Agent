package com.investa.service;

import com.investa.dto.HoldingDTO;
import com.investa.model.Transaction;
import com.investa.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final HoldingService holdingService;

    public TransactionService(TransactionRepository transactionRepository, HoldingService holdingService) {
        this.transactionRepository = transactionRepository;
        this.holdingService = holdingService;
    }

    public List<Transaction> getUserTransactions(String userId) {
        return transactionRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    @Transactional
    public Transaction executeTransaction(String userId, String symbol, String type, Double quantity, Double price, String broker) {
        // 1. Save Transaction
        Transaction transaction = new Transaction();
        transaction.setUserId(userId);
        transaction.setSymbol(symbol.toUpperCase());
        transaction.setType(type.toUpperCase());
        transaction.setQuantity(quantity);
        transaction.setPrice(price);
        transaction.setTotalAmount(quantity * price);
        transaction.setTimestamp(LocalDateTime.now());
        Transaction saved = transactionRepository.save(transaction);

        // 2. Update Holding
        List<HoldingDTO> holdings = holdingService.getUserHoldings(userId);
        HoldingDTO existing = holdings.stream()
                .filter(h -> h.getSymbol().equalsIgnoreCase(symbol))
                .findFirst()
                .orElse(null);

        if (type.equalsIgnoreCase("BUY")) {
            if (existing != null) {
                double newQuantity = existing.getQuantity() + quantity;
                double newInvested = existing.getInvested() + (quantity * price);
                double newAvgPrice = newInvested / newQuantity;
                
                existing.setQuantity(newQuantity);
                existing.setInvested(newInvested);
                existing.setAvgPrice(newAvgPrice);
                holdingService.updateHolding(existing.getId(), userId, existing);
            } else {
                HoldingDTO newHolding = HoldingDTO.builder()
                        .id(UUID.randomUUID().toString())
                        .symbol(symbol.toUpperCase())
                        .name(symbol.toUpperCase()) // Will fetch real name in UI or Finnhub service later
                        .quantity(quantity)
                        .avgPrice(price)
                        .invested(quantity * price)
                        .broker(broker)
                        .purchaseDate(LocalDateTime.now().toString())
                        .currentPrice(price)
                        .currentValue(quantity * price)
                        .build();
                holdingService.createHolding(userId, newHolding);
            }
        } else if (type.equalsIgnoreCase("SELL")) {
            if (existing != null) {
                double newQuantity = existing.getQuantity() - quantity;
                if (newQuantity <= 0) {
                    holdingService.deleteHolding(existing.getId(), userId);
                } else {
                    double newInvested = existing.getInvested() - (quantity * existing.getAvgPrice()); // Use avg price to reduce invested proportionally
                    existing.setQuantity(newQuantity);
                    existing.setInvested(newInvested);
                    holdingService.updateHolding(existing.getId(), userId, existing);
                }
            }
        }

        return saved;
    }
}
