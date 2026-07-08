package com.investa.controller;

import com.investa.model.Transaction;
import com.investa.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Transaction>> getUserTransactions(@PathVariable String userId) {
        return ResponseEntity.ok(transactionService.getUserTransactions(userId));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Transaction> executeTransaction(
            @PathVariable String userId,
            @RequestParam String symbol,
            @RequestParam String type,
            @RequestParam Double quantity,
            @RequestParam Double price,
            @RequestParam(defaultValue = "Investa") String broker) {
        return ResponseEntity.ok(transactionService.executeTransaction(userId, symbol, type, quantity, price, broker));
    }
}
