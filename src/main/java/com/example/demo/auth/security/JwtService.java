package com.example.demo.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {
    private static final int MIN_HMAC_KEY_BYTES = 32;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    public String generateToken(AuthenticatedUser user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId().toString());
        claims.put(
            "authorities",
            user.getAuthorities().stream().map(GrantedAuthority::getAuthority).sorted().toList()
        );

        Date now = new Date();
        Date expiredAt = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
            .claims(claims)
            .subject(user.getUsername())
            .issuedAt(now)
            .expiration(expiredAt)
            .signWith(getSigningKey())
            .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractAllClaims(token).get("userId", String.class));
    }

    public List<String> extractAuthorities(String token) {
        return extractAllClaims(token).get("authorities", List.class);
    }

    public boolean isTokenValid(String token, AuthenticatedUser user) {
        String username = extractUsername(token);
        return username.equals(user.getUsername()) && !isTokenExpired(token);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        String secret = jwtSecret == null ? "" : jwtSecret.trim();
        SecretKey base64Key = tryDecodeKey(secret, false);
        if (base64Key != null) {
            return base64Key;
        }

        try {
            SecretKey base64UrlKey = tryDecodeKey(secret, true);
            if (base64UrlKey != null) {
                return base64UrlKey;
            }
        } catch (IllegalArgumentException ignored) {
            // Fall back to the raw secret below.
        }

        byte[] rawKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (rawKeyBytes.length < MIN_HMAC_KEY_BYTES) {
            throw new IllegalStateException(
                "app.jwt.secret must be at least 32 bytes for HS256 when using a plain text secret."
            );
        }

        return Keys.hmacShaKeyFor(rawKeyBytes);
    }

    private SecretKey tryDecodeKey(String secret, boolean base64Url) {
        try {
            byte[] keyBytes = base64Url ? Decoders.BASE64URL.decode(secret) : Decoders.BASE64.decode(secret);
            if (keyBytes.length < MIN_HMAC_KEY_BYTES) {
                return null;
            }
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (DecodingException | IllegalArgumentException exception) {
            return null;
        }
    }
}
