package com.investa.controller;

import com.investa.model.Watchlist;
import com.investa.service.WatchlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WatchlistController {

    private final WatchlistService watchlistService;

    public WatchlistController(WatchlistService watchlistService) {
        this.watchlistService = watchlistService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Watchlist>> getUserWatchlist(@PathVariable String userId) {
        return ResponseEntity.ok(watchlistService.getUserWatchlist(userId));
    }

    @PostMapping("/{userId}/{symbol}")
    public ResponseEntity<Watchlist> addToWatchlist(
            @PathVariable String userId,
            @PathVariable String symbol,
            @RequestParam(required = false, defaultValue = "") String name) {
        return ResponseEntity.ok(watchlistService.addWatchlist(userId, symbol, name));
    }

    @DeleteMapping("/{userId}/{symbol}")
    public ResponseEntity<Void> removeFromWatchlist(
            @PathVariable String userId,
            @PathVariable String symbol) {
        watchlistService.removeWatchlist(userId, symbol);
        return ResponseEntity.ok().build();
    }
}
