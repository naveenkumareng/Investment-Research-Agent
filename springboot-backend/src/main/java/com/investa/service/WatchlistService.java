package com.investa.service;

import com.investa.model.Watchlist;
import com.investa.repository.WatchlistRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;

    public WatchlistService(WatchlistRepository watchlistRepository) {
        this.watchlistRepository = watchlistRepository;
    }

    public List<Watchlist> getUserWatchlist(String userId) {
        return watchlistRepository.findByUserIdOrderByAddedAtDesc(userId);
    }

    public Watchlist addWatchlist(String userId, String symbol, String name) {
        Optional<Watchlist> existing = watchlistRepository.findByUserIdAndSymbol(userId, symbol);
        if (existing.isPresent()) {
            return existing.get();
        }

        Watchlist watchlist = new Watchlist();
        watchlist.setUserId(userId);
        watchlist.setSymbol(symbol.toUpperCase());
        watchlist.setName(name);
        watchlist.setAddedAt(LocalDateTime.now());
        
        return watchlistRepository.save(watchlist);
    }

    public void removeWatchlist(String userId, String symbol) {
        watchlistRepository.deleteByUserIdAndSymbol(userId, symbol.toUpperCase());
    }
}
